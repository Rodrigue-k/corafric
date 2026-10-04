import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Ensure the studio_word_status table exists
async function ensureStudioTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS studio_word_status (
        word_id UUID PRIMARY KEY REFERENCES dictionary_words(id) ON DELETE CASCADE,
        track_number INTEGER NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        notes TEXT,
        operator_name VARCHAR(100),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
  } catch (err) {
    console.error("Error creating studio_word_status table:", err);
  }
}

export async function GET(request: Request) {
  try {
    await ensureStudioTable();

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
          d.id, 
          d.word_ewe, 
          COALESCE(d.word_fr, '') as word_fr, 
          COALESCE(d.definition, '') as definition, 
          COALESCE(d.part_of_speech, '') as part_of_speech,
          COALESCE(d.audio_url, '') as audio_url,
          COALESCE(s.status, CASE WHEN d.audio_url IS NOT NULL AND d.audio_url != '' THEN 'recorded' ELSE 'pending' END) as studio_status,
          COALESCE(s.operator_name, '') as operator_name,
          d.created_at
        FROM dictionary_words d
        LEFT JOIN studio_word_status s ON d.id = s.word_id
        WHERE (LOWER(d.word_ewe) LIKE ${q} OR LOWER(d.word_fr) LIKE ${q})
        ORDER BY d.word_ewe ASC
        LIMIT ${limit} OFFSET ${offset}
      `) as Record<string, unknown>[];
    } else if (filter === "without_audio") {
      rows = (await sql`
        SELECT 
          d.id, 
          d.word_ewe, 
          COALESCE(d.word_fr, '') as word_fr, 
          COALESCE(d.definition, '') as definition, 
          COALESCE(d.part_of_speech, '') as part_of_speech,
          COALESCE(d.audio_url, '') as audio_url,
          COALESCE(s.status, 'pending') as studio_status,
          COALESCE(s.operator_name, '') as operator_name,
          d.created_at
        FROM dictionary_words d
        LEFT JOIN studio_word_status s ON d.id = s.word_id
        WHERE (d.audio_url IS NULL OR d.audio_url = '')
        ORDER BY d.word_ewe ASC
        LIMIT ${limit} OFFSET ${offset}
      `) as Record<string, unknown>[];
    } else {
      rows = (await sql`
        SELECT 
          d.id, 
          d.word_ewe, 
          COALESCE(d.word_fr, '') as word_fr, 
          COALESCE(d.definition, '') as definition, 
          COALESCE(d.part_of_speech, '') as part_of_speech,
          COALESCE(d.audio_url, '') as audio_url,
          COALESCE(s.status, CASE WHEN d.audio_url IS NOT NULL AND d.audio_url != '' THEN 'recorded' ELSE 'pending' END) as studio_status,
          COALESCE(s.operator_name, '') as operator_name,
          d.created_at
        FROM dictionary_words d
        LEFT JOIN studio_word_status s ON d.id = s.word_id
        ORDER BY d.word_ewe ASC
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
      status: (row.studio_status as "pending" | "recorded" | "redo") || "pending",
      operatorName: (row.operator_name as string) || null,
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

export async function POST(request: Request) {
  try {
    await ensureStudioTable();

    const body = await request.json();
    const { wordId, trackNumber, status, operatorName, notes, action } = body;

    if (action === "reset_all") {
      await sql`TRUNCATE TABLE studio_word_status`;
      return NextResponse.json({ success: true, message: "Statuts studio réinitialisés" });
    }

    if (!wordId || !status) {
      return NextResponse.json(
        { error: "wordId et status sont requis" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO studio_word_status (word_id, track_number, status, operator_name, notes, updated_at)
      VALUES (
        ${wordId}, 
        ${trackNumber || 0}, 
        ${status}, 
        ${operatorName || 'Studio'}, 
        ${notes || null}, 
        NOW()
      )
      ON CONFLICT (word_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        operator_name = COALESCE(EXCLUDED.operator_name, studio_word_status.operator_name),
        notes = COALESCE(EXCLUDED.notes, studio_word_status.notes),
        updated_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      wordId,
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in POST /api/studio/words:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
