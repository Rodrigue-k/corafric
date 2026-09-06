import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureDbUser } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const fallbackName = clerkUser?.username || clerkUser?.firstName || `contributeur_${userId.substring(0, 8)}`;
    await ensureDbUser(userId, fallbackName);

    // User base stats
    const userStats = (await sql`
      SELECT 
        username,
        total_contributions,
        total_validations,
        created_at
      FROM users
      WHERE id = ${userId}
    `) as { username: string | null; total_contributions: number; total_validations: number; created_at: string }[];

    const baseUser = userStats[0] || {
      username: fallbackName,
      total_contributions: 0,
      total_validations: 0,
      created_at: new Date().toISOString(),
    };

    // Quality stats: average score received on own recordings, rejected count
    const qualityStats = (await sql`
      SELECT 
        COALESCE(AVG(r.average_score), 0)::float AS avg_score_received,
        COALESCE(SUM(r.rejected_count), 0)::int  AS total_rejected
      FROM recordings r
      WHERE r.user_id = ${userId}
        AND r.validation_count > 0
    `) as { avg_score_received: number; total_rejected: number }[];

    // Words where this user is the official voice (best recording)
    const wordsWon = (await sql`
      SELECT w.word_ewe, w.word_fr
      FROM recordings r
      JOIN dictionary_words w ON w.id = r.word_id
      WHERE r.user_id = ${userId}
        AND r.is_best_for_word = TRUE
      ORDER BY w.word_ewe ASC
    `) as { word_ewe: string; word_fr: string | null }[];

    // Approved recordings count
    const approvedCountResult = (await sql`
      SELECT COUNT(*)::int as approved_count
      FROM recordings
      WHERE user_id = ${userId} AND status = 'approved'
    `) as { approved_count: number }[];

    const approvedCount = approvedCountResult[0]?.approved_count ?? 0;
    const bestCount = wordsWon.length;
    const totalContributions = baseUser.total_contributions;
    const totalValidations = baseUser.total_validations;

    // Score calculation
    const score = (totalContributions * 10) + (approvedCount * 15) + (bestCount * 50) + (totalValidations * 3);

    // Rank among all contributors by score
    const rankResult = (await sql`
      WITH user_scores AS (
        SELECT 
          u.id,
          (
            (COALESCE(u.total_contributions, 0) * 10) +
            (COALESCE(appr.approved_count, 0) * 15) +
            (COALESCE(best.best_count, 0) * 50) +
            (COALESCE(u.total_validations, 0) * 3)
          )::int as calculated_score
        FROM users u
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as approved_count
          FROM recordings
          WHERE status = 'approved' AND user_id IS NOT NULL
          GROUP BY user_id
        ) appr ON appr.user_id = u.id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as best_count
          FROM recordings
          WHERE is_best_for_word = TRUE AND user_id IS NOT NULL
          GROUP BY user_id
        ) best ON best.user_id = u.id
      )
      SELECT COUNT(*)::int + 1 AS rank
      FROM user_scores
      WHERE calculated_score > ${score}
    `) as { rank: number }[];

    return NextResponse.json({
      dbUsername: baseUser.username,
      score,
      totalContributions,
      totalValidations,
      approvedCount,
      bestCount,
      avgScoreReceived: Math.round((qualityStats[0]?.avg_score_received ?? 0) * 10) / 10,
      totalRejected: qualityStats[0]?.total_rejected ?? 0,
      wordsWon: wordsWon.map((w) => ({ word: w.word_ewe, translation: w.word_fr })),
      rank: rankResult[0]?.rank ?? 1,
      memberSince: baseUser.created_at,
    });
  } catch (error) {
    console.error("Error in GET /api/me/stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
