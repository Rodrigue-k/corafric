import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // 'all' | 'without_audio' | 'with_audio'
    const search = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "1500", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let rows;
    if (search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      rows = (await sql`
        SELECT 
          id, 
          word_ewe, 
          COALESCE(word_fr, '') as word_fr, 
          COALESCE(definition, '') as definition, 
          COALESCE(part_of_speech, '') as part_of_speech,
          COALESCE(audio_url, '') as audio_url,
          created_at
        FROM dictionary_words
        WHERE (LOWER(word_ewe) LIKE ${q} OR LOWER(word_fr) LIKE ${q})
        ORDER BY word_ewe ASC
        LIMIT ${limit} OFFSET ${offset}
      `) as Record<string, unknown>[];
    } else if (filter === "without_audio") {
      rows = (await sql`
        SELECT 
          id, 
          word_ewe, 
          COALESCE(word_fr, '') as word_fr, 
          COALESCE(definition, '') as definition, 
          COALESCE(part_of_speech, '') as part_of_speech,
          COALESCE(audio_url, '') as audio_url,
          created_at
        FROM dictionary_words
        WHERE audio_url IS NULL OR audio_url = ''
        ORDER BY word_ewe ASC
        LIMIT ${limit} OFFSET ${offset}
      `) as Record<string, unknown>[];
    } else {
      rows = (await sql`
        SELECT 
          id, 
          word_ewe, 
          COALESCE(word_fr, '') as word_fr, 
          COALESCE(definition, '') as definition, 
          COALESCE(part_of_speech, '') as part_of_speech,
          COALESCE(audio_url, '') as audio_url,
          created_at
        FROM dictionary_words
        ORDER BY word_ewe ASC
        LIMIT ${limit} OFFSET ${offset}
      `) as Record<string, unknown>[];
    }

    const words = rows.map((row, idx) => ({
      trackNumber: offset + idx + 1,
      trackLabel: `PISTE ${(offset + idx + 1).toString().padStart(3, "0")}`,
      id: row.id as string,
      wordEwe: row.word_ewe as string,
      wordFr: row.word_fr as string,
      definition: row.definition as string,
      partOfSpeech: row.part_of_speech as string,
      hasAudio: !!row.audio_url,
      audioUrl: (row.audio_url as string) || null,
    }));

    return NextResponse.json({
      total: words.length,
      words,
    });
  } catch (error) {
    console.error("Error in GET /api/studio/words:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
