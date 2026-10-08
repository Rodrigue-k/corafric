import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";

    let rows;
    if (search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      rows = await sql`
        SELECT id, word_ewe, COALESCE(word_fr, '') as word_fr, COALESCE(definition, '') as definition
        FROM dictionary_words
        WHERE (audio_url IS NULL OR audio_url = '')
          AND (is_rejected IS NULL OR is_rejected = FALSE)
          AND (LOWER(word_ewe) LIKE ${q} OR LOWER(word_fr) LIKE ${q})
        ORDER BY word_ewe ASC
        LIMIT 100
      `;
    } else {
      rows = await sql`
        SELECT id, word_ewe, COALESCE(word_fr, '') as word_fr, COALESCE(definition, '') as definition
        FROM dictionary_words
        WHERE (audio_url IS NULL OR audio_url = '')
          AND (is_rejected IS NULL OR is_rejected = FALSE)
        ORDER BY word_ewe ASC
        LIMIT 100
      `;
    }

    const words = rows.map(r => ({
      id: r.id,
      wordEwe: r.word_ewe,
      wordFr: r.word_fr,
      definition: r.definition
    }));

    return NextResponse.json({ words });
  } catch (error) {
    console.error("Error in pending-words:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
