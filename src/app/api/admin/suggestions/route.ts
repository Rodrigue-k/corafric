import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    let suggestions;
    if (status === "all") {
      suggestions = await sql`
        SELECT 
          s.id,
          s.word_id,
          s.user_id,
          s.user_display_name,
          s.suggested_fr,
          s.suggested_en,
          s.suggested_def,
          s.notes,
          s.status,
          s.created_at,
          w.word_ewe,
          w.word_fr AS current_fr,
          w.word_en AS current_en,
          w.definition AS current_def
        FROM translation_suggestions s
        JOIN dictionary_words w ON w.id = s.word_id
        ORDER BY s.created_at DESC
        LIMIT 100
      `;
    } else {
      suggestions = await sql`
        SELECT 
          s.id,
          s.word_id,
          s.user_id,
          s.user_display_name,
          s.suggested_fr,
          s.suggested_en,
          s.suggested_def,
          s.notes,
          s.status,
          s.created_at,
          w.word_ewe,
          w.word_fr AS current_fr,
          w.word_en AS current_en,
          w.definition AS current_def
        FROM translation_suggestions s
        JOIN dictionary_words w ON w.id = s.word_id
        WHERE s.status = ${status}
        ORDER BY s.created_at DESC
        LIMIT 100
      `;
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error in GET /api/admin/suggestions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }

    const body = await request.json();
    const { suggestionId, action } = body as { suggestionId?: string; action?: "approve" | "reject" };

    if (!suggestionId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "suggestionId et action ('approve' | 'reject') sont requis." }, { status: 400 });
    }

    const suggestionRows = (await sql`
      SELECT * FROM translation_suggestions WHERE id = ${suggestionId}
    `) as {
      id: string;
      word_id: string;
      suggested_fr: string | null;
      suggested_en: string | null;
      suggested_def: string | null;
    }[];

    if (suggestionRows.length === 0) {
      return NextResponse.json({ error: "Suggestion introuvable." }, { status: 404 });
    }

    const suggestion = suggestionRows[0];

    if (action === "approve") {
      // 1. Update dictionary_words with the approved suggestion
      await sql`
        UPDATE dictionary_words
        SET 
          word_fr = COALESCE(${suggestion.suggested_fr?.trim() || null}, word_fr),
          word_en = COALESCE(${suggestion.suggested_en?.trim() || null}, word_en),
          definition = COALESCE(${suggestion.suggested_def?.trim() || null}, definition),
          updated_at = NOW()
        WHERE id = ${suggestion.word_id}
      `;

      // 2. Mark suggestion as approved
      await sql`
        UPDATE translation_suggestions
        SET status = 'approved'
        WHERE id = ${suggestionId}
      `;

      return NextResponse.json({ success: true, message: "Suggestion approuvée et intégrée au dictionnaire !" });
    } else {
      // Mark suggestion as rejected
      await sql`
        UPDATE translation_suggestions
        SET status = 'rejected'
        WHERE id = ${suggestionId}
      `;

      return NextResponse.json({ success: true, message: "Suggestion rejetée." });
    }
  } catch (error) {
    console.error("Error in POST /api/admin/suggestions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
