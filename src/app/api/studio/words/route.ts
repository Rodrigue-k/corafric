import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";
import { auth } from "@clerk/nextjs/server";

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
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    await ensureStudioTable();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const search = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    // 1. Fetch Global Stats for HUD
    const statsResult = await sql`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE validation_status = 'validated' OR is_validated = TRUE)::int AS validated,
        COUNT(*) FILTER (WHERE validation_status = 'rejected' OR is_rejected = TRUE)::int AS rejected,
        COUNT(*) FILTER (
          WHERE (validation_status = 'pending' OR validation_status IS NULL) 
            AND (is_validated IS NOT TRUE OR is_validated IS NULL) 
            AND (is_rejected IS NOT TRUE OR is_rejected IS NULL)
        )::int AS pending,
        COUNT(*) FILTER (WHERE audio_url IS NOT NULL AND audio_url != '')::int AS with_audio
      FROM dictionary_words
    `;
    const globalStats = statsResult[0] || {
      total: 0,
      validated: 0,
      rejected: 0,
      pending: 0,
      with_audio: 0,
    };

    // 2. Build Query with conditions
    let rows: Record<string, unknown>[] = [];
    const qPattern = search ? `%${search.toLowerCase()}%` : null;

    if (qPattern) {
      if (filter === "validated") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            COALESCE(d.validation_status, 'validated') as status,
            COALESCE(d.validated_by, s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.validation_status = 'validated' OR d.is_validated = TRUE)
            AND (LOWER(d.word_ewe) LIKE ${qPattern} OR LOWER(d.word_fr) LIKE ${qPattern})
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else if (filter === "rejected") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            'rejected' as status,
            COALESCE(d.rejected_by, s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.validation_status = 'rejected' OR d.is_rejected = TRUE)
            AND (LOWER(d.word_ewe) LIKE ${qPattern} OR LOWER(d.word_fr) LIKE ${qPattern})
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else if (filter === "pending") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            'pending' as status,
            COALESCE(s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.validation_status = 'pending' OR d.validation_status IS NULL)
            AND (d.is_validated IS NOT TRUE OR d.is_validated IS NULL)
            AND (d.is_rejected IS NOT TRUE OR d.is_rejected IS NULL)
            AND (LOWER(d.word_ewe) LIKE ${qPattern} OR LOWER(d.word_fr) LIKE ${qPattern})
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else if (filter === "with_audio") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            COALESCE(d.validation_status, 'pending') as status,
            COALESCE(s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.audio_url IS NOT NULL AND d.audio_url != '')
            AND (LOWER(d.word_ewe) LIKE ${qPattern} OR LOWER(d.word_fr) LIKE ${qPattern})
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else if (filter === "without_audio") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            COALESCE(d.validation_status, 'pending') as status,
            COALESCE(s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.audio_url IS NULL OR d.audio_url = '')
            AND (LOWER(d.word_ewe) LIKE ${qPattern} OR LOWER(d.word_fr) LIKE ${qPattern})
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            CASE 
              WHEN d.validation_status = 'rejected' OR d.is_rejected = TRUE THEN 'rejected'
              WHEN d.validation_status = 'validated' OR d.is_validated = TRUE THEN 'validated'
              ELSE 'pending'
            END as status,
            COALESCE(s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (LOWER(d.word_ewe) LIKE ${qPattern} OR LOWER(d.word_fr) LIKE ${qPattern})
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      }
    } else {
      if (filter === "validated") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            COALESCE(d.validation_status, 'validated') as status,
            COALESCE(d.validated_by, s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.validation_status = 'validated' OR d.is_validated = TRUE)
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else if (filter === "rejected") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            'rejected' as status,
            COALESCE(d.rejected_by, s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.validation_status = 'rejected' OR d.is_rejected = TRUE)
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else if (filter === "pending") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            'pending' as status,
            COALESCE(s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.validation_status = 'pending' OR d.validation_status IS NULL)
            AND (d.is_validated IS NOT TRUE OR d.is_validated IS NULL)
            AND (d.is_rejected IS NOT TRUE OR d.is_rejected IS NULL)
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else if (filter === "with_audio") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            CASE 
              WHEN d.validation_status = 'rejected' OR d.is_rejected = TRUE THEN 'rejected'
              WHEN d.validation_status = 'validated' OR d.is_validated = TRUE THEN 'validated'
              ELSE 'pending'
            END as status,
            COALESCE(s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.audio_url IS NOT NULL AND d.audio_url != '')
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else if (filter === "without_audio") {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            CASE 
              WHEN d.validation_status = 'rejected' OR d.is_rejected = TRUE THEN 'rejected'
              WHEN d.validation_status = 'validated' OR d.is_validated = TRUE THEN 'validated'
              ELSE 'pending'
            END as status,
            COALESCE(s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          WHERE (d.audio_url IS NULL OR d.audio_url = '')
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      } else {
        rows = (await sql`
          SELECT 
            d.id, d.word_ewe, COALESCE(d.word_fr, '') as word_fr, 
            COALESCE(d.definition, '') as definition, COALESCE(d.part_of_speech, '') as part_of_speech,
            COALESCE(d.audio_url, '') as audio_url,
            CASE 
              WHEN d.validation_status = 'rejected' OR d.is_rejected = TRUE THEN 'rejected'
              WHEN d.validation_status = 'validated' OR d.is_validated = TRUE THEN 'validated'
              ELSE 'pending'
            END as status,
            COALESCE(s.operator_name, '') as operator_name,
            COUNT(*) OVER()::int as filtered_total
          FROM dictionary_words d
          LEFT JOIN studio_word_status s ON d.id = s.word_id
          ORDER BY d.word_ewe ASC
          LIMIT ${limit} OFFSET ${offset}
        `) as Record<string, unknown>[];
      }
    }

    const filteredTotal = rows.length > 0 ? Number(rows[0].filtered_total) : 0;
    const totalPages = Math.ceil(filteredTotal / limit) || 1;

    const words = rows.map((row, idx) => ({
      trackNumber: offset + idx + 1,
      trackLabel: `Piste ${(offset + idx + 1).toString().padStart(3, "0")}`,
      id: row.id as string,
      wordEwe: row.word_ewe as string,
      wordFr: row.word_fr as string,
      definition: row.definition as string,
      partOfSpeech: row.part_of_speech as string,
      hasAudio: !!row.audio_url,
      audioUrl: (row.audio_url as string) || null,
      status: (row.status as "pending" | "validated" | "rejected") || "pending",
      operatorName: (row.operator_name as string) || null,
    }));

    return NextResponse.json({
      page,
      limit,
      totalPages,
      filteredTotal,
      stats: {
        total: Number(globalStats.total),
        validated: Number(globalStats.validated),
        rejected: Number(globalStats.rejected),
        pending: Number(globalStats.pending),
        withAudio: Number(globalStats.with_audio),
      },
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
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { userId } = await auth();
    await ensureStudioTable();

    const body = await request.json();
    const { wordId, trackNumber, status, operatorName, notes, action } = body;

    if (action === "reset_all") {
      await sql`TRUNCATE TABLE studio_word_status`;
      await sql`
        UPDATE dictionary_words 
        SET validation_status = 'pending', is_validated = FALSE, is_rejected = FALSE
      `;
      return NextResponse.json({ success: true, message: "Statuts studio réinitialisés" });
    }

    if (!wordId || !status) {
      return NextResponse.json(
        { error: "wordId et status sont requis" },
        { status: 400 }
      );
    }

    const operator = operatorName || userId || "Studio";

    // 1. Update dictionary_words master record
    if (status === "validated" || status === "recorded") {
      await sql`
        UPDATE dictionary_words
        SET 
          validation_status = 'validated',
          is_validated = TRUE,
          is_rejected = FALSE,
          validated_by = ${operator},
          validated_at = NOW()
        WHERE id = ${wordId}
      `;
    } else if (status === "rejected") {
      await sql`
        UPDATE dictionary_words
        SET 
          validation_status = 'rejected',
          is_rejected = TRUE,
          is_validated = FALSE,
          rejected_by = ${operator},
          rejected_at = NOW()
        WHERE id = ${wordId}
      `;
    } else {
      // pending
      await sql`
        UPDATE dictionary_words
        SET 
          validation_status = 'pending',
          is_validated = FALSE,
          is_rejected = FALSE
        WHERE id = ${wordId}
      `;
    }

    // 2. Also keep studio_word_status synced
    await sql`
      INSERT INTO studio_word_status (word_id, track_number, status, operator_name, notes, updated_at)
      VALUES (
        ${wordId}, 
        ${trackNumber || 0}, 
        ${status}, 
        ${operator}, 
        ${notes || null}, 
        NOW()
      )
      ON CONFLICT (word_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        operator_name = EXCLUDED.operator_name,
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
