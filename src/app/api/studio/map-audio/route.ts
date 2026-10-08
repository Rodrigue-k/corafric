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
    const { wordId, audioUrl, action, force } = body;

    if (!wordId) {
      return NextResponse.json({ error: "wordId est requis" }, { status: 400 });
    }

    // Unlink action: resets audio on word so it returns to unassigned pool
    if (action === "unlink") {
      await sql`
        UPDATE dictionary_words 
        SET 
          audio_url = NULL,
          validation_status = 'pending',
          is_validated = FALSE,
          updated_at = NOW()
        WHERE id = ${wordId}
      `;

      await sql`
        UPDATE studio_word_status
        SET status = 'pending', updated_at = NOW()
        WHERE id = ${wordId}
      `;

      return NextResponse.json({ success: true, message: "Audio délié avec succès." });
    }

    if (!audioUrl) {
      return NextResponse.json({ error: "audioUrl est requis" }, { status: 400 });
    }

    const decodedUrl = decodeURI(audioUrl);
    const encodedUrl = encodeURI(audioUrl);
    const rawFilename = audioUrl.split("/").pop();
    const decodedFilename = rawFilename ? decodeURIComponent(rawFilename) : "";

    // 1. Anti-collision: check if audio is already claimed by another word
    if (!force) {
      const existingWithAudio = await sql`
        SELECT id, word_ewe FROM dictionary_words 
        WHERE (
          audio_url = ${audioUrl} 
          OR audio_url = ${decodedUrl} 
          OR audio_url = ${encodedUrl}
          ${decodedFilename ? sql`OR audio_url LIKE ${'%' + decodedFilename}` : sql``}
        )
          AND id != ${wordId}
        LIMIT 1
      `;

      if (existingWithAudio.length > 0) {
        return NextResponse.json({ 
          conflict: true,
          error: `Cette piste audio a déjà été liée au mot « ${existingWithAudio[0].word_ewe} » par un autre membre de l'équipe.`
        }, { status: 409 });
      }
    }

    // 2. Fetch target word
    const targetWords = await sql`
      SELECT id, word_ewe, audio_url, validation_status, validated_by 
      FROM dictionary_words 
      WHERE id = ${wordId}
      LIMIT 1
    `;

    if (targetWords.length === 0) {
      return NextResponse.json({ error: "Mot introuvable dans le lexique" }, { status: 404 });
    }

    // 3. Map the audio and validate the word atomically
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

    return NextResponse.json({ 
      success: true, 
      wordId, 
      wordEwe: targetWords[0].word_ewe,
      audioUrl 
    });
  } catch (error) {
    console.error("Error in map-audio:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
