import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Veuillez vous connecter pour suggérer ou corriger une traduction." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { wordId, suggestedFr, suggestedEn, suggestedDef, notes } = body;

    if (!wordId || (!suggestedFr && !suggestedEn && !suggestedDef)) {
      return NextResponse.json(
        { error: "Veuillez fournir au moins une traduction (français, anglais) ou définition." },
        { status: 400 }
      );
    }

    // Get user info
    const userRows = (await sql`
      SELECT username FROM users WHERE id = ${userId}
    `) as { username: string | null }[];
    const username = userRows[0]?.username || "Contributeur";

    // Insert suggestion
    await sql`
      INSERT INTO translation_suggestions (
        word_id, user_id, user_display_name, suggested_fr, suggested_en, suggested_def, notes
      ) VALUES (
        ${wordId}, ${userId}, ${username}, ${suggestedFr || null}, ${suggestedEn || null}, ${suggestedDef || null}, ${notes || null}
      )
    `;

    // If the word currently has no French translation, or if updated by user, enrich word directly
    if (suggestedFr) {
      await sql`
        UPDATE dictionary_words
        SET 
          word_fr = COALESCE(word_fr, ${suggestedFr.trim()}),
          word_en = COALESCE(word_en, ${suggestedEn ? suggestedEn.trim() : null}),
          definition = COALESCE(definition, ${suggestedDef ? suggestedDef.trim() : null})
        WHERE id = ${wordId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Merci pour votre contribution ! Votre proposition a été enregistrée.",
    });
  } catch (error) {
    console.error("Error in POST /api/dictionary/suggest:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
