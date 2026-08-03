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
    const username = clerkUser?.username || clerkUser?.firstName || `contributeur_${userId.substring(0, 8)}`;
    await ensureDbUser(userId, username);

    // Get next pending recording not yet validated by the current user
    // Prioritizes recordings from other users, but allows self-testing if testing solo
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
        CASE WHEN r.user_id != ${userId} THEN 0 ELSE 1 END,
        r.created_at ASC
      LIMIT 1
    `) as Record<string, unknown>[];

    if (result.length === 0) {
      return NextResponse.json({ recording: null, message: "Aucun enregistrement en attente de validation !" });
    }

    const row = result[0];
    let rawAudioUrl = row.audio_url as string;
    if (rawAudioUrl && rawAudioUrl.includes("r2.cloudflarestorage.com/")) {
      const fileKey = rawAudioUrl.split("r2.cloudflarestorage.com/")[1];
      rawAudioUrl = `/api/audio/${fileKey}`;
    }

    return NextResponse.json({
      recording: {
        id: row.id,
        audioUrl: rawAudioUrl,
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
