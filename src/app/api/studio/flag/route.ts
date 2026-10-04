import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      userId = null;
    }

    const body = await request.json();
    const { sentenceId, reason, suggestedFix, notes, operatorName } = body as {
      sentenceId?: string;
      reason?: string;
      suggestedFix?: string;
      notes?: string;
      operatorName?: string;
    };

    if (!sentenceId || !reason) {
      return NextResponse.json(
        { error: "sentenceId et reason sont requis." },
        { status: 400 }
      );
    }

    // 1. Get original sentence data
    const sentenceRows = (await sql`
      SELECT id, text, COALESCE(translation_fr, french_translation, '') AS translation_fr
      FROM sentences
      WHERE id = ${sentenceId}
    `) as { id: string; text: string; translation_fr: string }[];

    if (sentenceRows.length === 0) {
      return NextResponse.json({ error: "Phrase introuvable." }, { status: 404 });
    }

    const originalSentence = sentenceRows[0];

    // 2. Insert into flagged_sentences
    await sql`
      INSERT INTO flagged_sentences (
        sentence_id,
        operator_id,
        operator_name,
        reason,
        suggested_fix,
        notes,
        original_text,
        original_translation,
        status
      ) VALUES (
        ${sentenceId},
        ${userId || "studio_operator"},
        ${operatorName || "Opérateur Studio"},
        ${reason},
        ${suggestedFix?.trim() || null},
        ${notes?.trim() || null},
        ${originalSentence.text},
        ${originalSentence.translation_fr},
        'pending'
      )
    `;

    // 3. Mark sentence as flagged so it is set aside and never presented again in studio queue
    await sql`
      UPDATE sentences
      SET is_flagged = TRUE
      WHERE id = ${sentenceId}
    `;

    return NextResponse.json({
      success: true,
      message: "Phrase mise de côté et signalée pour examen ultérieur.",
    });
  } catch (error) {
    console.error("Error in POST /api/studio/flag:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
