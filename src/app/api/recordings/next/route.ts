import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get next pending recording recorded by someone else and not yet validated by the current user
    const result = await sql`
      SELECT r.id, r.audio_url, s.text as sentence_text, s.language as sentence_language
      FROM recordings r
      JOIN sentences s ON r.sentence_id = s.id
      LEFT JOIN validations v ON v.recording_id = r.id AND v.user_id = ${userId}
      WHERE r.status = 'pending'
        AND r.user_id != ${userId}
        AND v.id IS NULL
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ recording: null, message: "Aucun enregistrement en attente de validation !" });
    }

    const row = result[0];
    return NextResponse.json({
      recording: {
        id: row.id,
        audioUrl: row.audio_url,
        sentence: {
          text: row.sentence_text,
          language: row.sentence_language,
        },
      },
    });
  } catch (error) {
    console.error("Error in GET /api/recordings/next:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
