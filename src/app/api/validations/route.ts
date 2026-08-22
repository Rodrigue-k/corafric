import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureDbUser } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure validator exists in users table
    const clerkUser = await currentUser();
    const username = clerkUser?.username || clerkUser?.firstName || `validateur_${userId.substring(0, 8)}`;
    await ensureDbUser(userId, username);

    const body = await request.json() as { recordingId?: string; score?: number; isValid?: boolean };
    const { recordingId } = body;

    // Support both old boolean votes (legacy) and new 1-5 score
    let score: number;
    if (typeof body.score === "number" && body.score >= 1 && body.score <= 5) {
      score = body.score;
    } else if (typeof body.isValid === "boolean") {
      // Legacy compat: convert boolean to score
      score = body.isValid ? 5 : 1;
    } else {
      return NextResponse.json(
        { error: "score (1–5) is required" },
        { status: 400 }
      );
    }

    if (!recordingId) {
      return NextResponse.json(
        { error: "recordingId is required" },
        { status: 400 }
      );
    }

    // 1. Insert/update the validation vote with score
    await sql`
      INSERT INTO validations (recording_id, user_id, is_valid, score)
      VALUES (${recordingId}, ${userId}, ${score >= 3}, ${score})
      ON CONFLICT (recording_id, user_id) DO UPDATE 
        SET is_valid = ${score >= 3}, score = ${score}
    `;

    // 2. Recalculate stats: average score, rejected count, total validation count
    const stats = (await sql`
      SELECT 
        COUNT(*)::int                                            AS total,
        AVG(score)::float                                       AS avg_score,
        COUNT(CASE WHEN score <= 2 THEN 1 END)::int             AS bad_count,
        COUNT(CASE WHEN score >= 4 THEN 1 END)::int             AS good_count
      FROM validations
      WHERE recording_id = ${recordingId}
        AND score IS NOT NULL
    `) as { total: number; avg_score: number; bad_count: number; good_count: number }[];

    const totalVotes = stats[0]?.total ?? 0;
    const avgScore   = stats[0]?.avg_score ?? 0;
    const badCount   = stats[0]?.bad_count ?? 0;

    // ── Status decision logic ────────────────────────────────────────────────
    // Minimum 3 votes required to make a decision
    let newStatus = "pending";
    if (totalVotes >= 3) {
      if (avgScore < 2.0 || (badCount >= 3 && badCount > totalVotes / 2)) {
        newStatus = "rejected";
      } else if (avgScore >= 3.5) {
        newStatus = "approved";
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // 3. Update recording with new stats
    const updatedRecs = (await sql`
      UPDATE recordings
      SET 
        status           = ${newStatus},
        validation_count = ${totalVotes},
        average_score    = ${avgScore},
        rejected_count   = ${badCount}
      WHERE id = ${recordingId}
      RETURNING word_id, audio_url, average_score
    `) as { word_id: string | null; audio_url: string; average_score: number }[];

    // 4. If approved and linked to a word, promote to "best audio" if it's the top scorer
    if (newStatus === "approved" && updatedRecs[0]?.word_id) {
      const wordId = updatedRecs[0].word_id;
      const thisAvg = updatedRecs[0].average_score;

      // Check if another approved recording for this word already has a higher score
      const currentBest = (await sql`
        SELECT id, average_score
        FROM recordings
        WHERE word_id = ${wordId}
          AND status   = 'approved'
          AND id      != ${recordingId}
          AND is_best_for_word = TRUE
        ORDER BY average_score DESC
        LIMIT 1
      `) as { id: string; average_score: number }[];

      const currentBestScore = currentBest[0]?.average_score ?? 0;

      if (thisAvg >= currentBestScore) {
        // Demote previous best
        if (currentBest[0]?.id) {
          await sql`
            UPDATE recordings SET is_best_for_word = FALSE WHERE id = ${currentBest[0].id}
          `;
        }
        // Promote current recording
        await sql`
          UPDATE recordings SET is_best_for_word = TRUE WHERE id = ${recordingId}
        `;
        // Update dictionary_words audio_url to this best recording
        await sql`
          UPDATE dictionary_words
          SET audio_url = ${updatedRecs[0].audio_url}, updated_at = NOW()
          WHERE id = ${wordId}
        `;
      }
    }

    // 5. Increment validator total_validations
    await sql`
      UPDATE users
      SET total_validations = total_validations + 1
      WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, status: newStatus, avgScore, totalVotes });
  } catch (error) {
    console.error("Error in POST /api/validations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
