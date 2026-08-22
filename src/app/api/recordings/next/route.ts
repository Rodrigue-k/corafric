import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureDbUser } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildAudioUrl(rawUrl: string): string {
  if (rawUrl && rawUrl.includes("r2.cloudflarestorage.com/")) {
    const fileKey = rawUrl.split("r2.cloudflarestorage.com/")[1];
    return `/api/audio/${fileKey}`;
  }
  return rawUrl;
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const username = clerkUser?.username || clerkUser?.firstName || `contributeur_${userId.substring(0, 8)}`;
    await ensureDbUser(userId, username);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode"); // "comparative" | null

    // ─── COMPARATIVE MODE: 3 audios for the same word ──────────────────────
    if (mode === "comparative") {
      // Find a word_id that has at least 2 pending recordings not yet voted by this user
      // Wave priority: prioritize words that already have active votes to close them faster
      const wordCandidates = (await sql`
        SELECT r.word_id, COUNT(*) AS cnt, MAX(r.validation_count) AS max_votes
        FROM recordings r
        LEFT JOIN validations v ON v.recording_id = r.id AND v.user_id = ${userId}
        WHERE r.status = 'pending'
          AND r.word_id IS NOT NULL
          AND v.id IS NULL
          AND (r.user_id IS NULL OR r.user_id != ${userId})
        GROUP BY r.word_id
        HAVING COUNT(*) >= 2
        ORDER BY max_votes DESC, cnt DESC
        LIMIT 1
      `) as { word_id: string; cnt: number }[];

      if (wordCandidates.length > 0) {
        const wordId = wordCandidates[0].word_id;

        const rows = (await sql`
          SELECT 
            r.id, 
            r.audio_url,
            COALESCE(w.word_ewe, s.text) AS text,
            COALESCE(w.word_fr, s.language) AS translation,
            w.definition
          FROM recordings r
          LEFT JOIN sentences s ON r.sentence_id = s.id
          LEFT JOIN dictionary_words w ON r.word_id = w.id
          LEFT JOIN validations v ON v.recording_id = r.id AND v.user_id = ${userId}
          WHERE r.status = 'pending'
            AND r.word_id = ${wordId}
            AND v.id IS NULL
          ORDER BY r.validation_count DESC, r.created_at ASC
          LIMIT 3
        `) as Record<string, unknown>[];

        const recordings = rows.map((row, idx) => ({
          id: row.id,
          audioUrl: buildAudioUrl(row.audio_url as string),
          label: String.fromCharCode(65 + idx), // A, B, C
          sentence: { text: row.text as string, language: (row.translation as string) || "ewe" },
          word: { text: row.text as string, translation: row.translation as string, definition: row.definition as string },
        }));

        return NextResponse.json({ mode: "comparative", recordings });
      }

      // Fallback: not enough audios for comparative → return single mode
    }
    // ────────────────────────────────────────────────────────────────────────

    // ─── SINGLE MODE (default): Prioritize words nearing completion ──────────
    const result = (await sql`
      SELECT 
        r.id, 
        r.audio_url, 
        COALESCE(w.word_ewe, s.text) as text, 
        COALESCE(w.word_fr, s.language) as translation,
        w.definition
      FROM recordings r
      LEFT JOIN sentences s ON r.sentence_id = s.id
      LEFT JOIN dictionary_words w ON r.word_id = w.id
      LEFT JOIN validations v ON v.recording_id = r.id AND v.user_id = ${userId}
      WHERE r.status = 'pending'
        AND v.id IS NULL
      ORDER BY 
        CASE WHEN (r.user_id IS NULL OR r.user_id != ${userId}) THEN 0 ELSE 1 END,
        r.validation_count DESC,
        r.created_at ASC
      LIMIT 1
    `) as Record<string, unknown>[];


    if (result.length === 0) {
      return NextResponse.json({ recording: null, message: "Aucun enregistrement en attente de validation !" });
    }

    const row = result[0];

    return NextResponse.json({
      mode: "single",
      recording: {
        id: row.id,
        audioUrl: buildAudioUrl(row.audio_url as string),
        sentence: {
          text: row.text,
          language: row.translation || "ewe",
        },
        word: {
          text: row.text,
          translation: row.translation,
          definition: row.definition,
        }
      },
    });
  } catch (error) {
    console.error("Error in GET /api/recordings/next:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

