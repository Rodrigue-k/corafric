import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "5", 10);
    const limit = Math.min(Math.max(limitParam, 1), 20);

    const rows = (await sql`
      SELECT 
        id, 
        text, 
        language, 
        COALESCE(translation_fr, french_translation, '') AS translation_fr, 
        domain, 
        length_category
      FROM sentences
      WHERE is_active = TRUE
        AND is_flagged = FALSE
        AND (recording_status IS NULL OR recording_status = 'pending')
      ORDER BY created_at ASC
      LIMIT ${limit}
    `) as Record<string, unknown>[];

    const sentences = rows.map((row) => ({
      id: row.id as string,
      text: row.text as string,
      language: (row.language as string) || "ewe",
      translationFr: (row.translation_fr as string) || "",
      domain: (row.domain as string) || "general",
      lengthCategory: (row.length_category as string) || "medium",
    }));

    return NextResponse.json({ sentences });
  } catch (error) {
    console.error("Error in GET /api/studio/next:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
