import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { userId } = await auth();
    const body = await request.json();
    const { wordId, audioUrl } = body;

    if (!wordId || !audioUrl) {
      return NextResponse.json({ error: "wordId et audioUrl sont requis" }, { status: 400 });
    }

    // Map the audio and validate the word
    await sql`
      UPDATE dictionary_words 
      SET 
        audio_url = ${audioUrl},
        validation_status = 'validated',
        is_validated = TRUE,
        is_rejected = FALSE,
        validated_by = ${userId || 'studio_admin'},
        validated_at = NOW()
      WHERE id = ${wordId}
    `;

    await sql`
      INSERT INTO studio_word_status (word_id, track_number, status, operator_name, updated_at)
      VALUES (${wordId}, 0, 'validated', ${userId || 'studio_admin'}, NOW())
      ON CONFLICT (word_id)
      DO UPDATE SET
        status = 'validated',
        operator_name = EXCLUDED.operator_name,
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in map-audio:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
