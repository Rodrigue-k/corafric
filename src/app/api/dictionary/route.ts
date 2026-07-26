import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const letter = searchParams.get("letter")?.toLowerCase().trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const offset = (page - 1) * limit;

    // Get total count of words in dictionary
    const countResult = (await sql`SELECT COUNT(*)::int as count FROM dictionary_words`) as { count: number }[];
    const totalCount = countResult[0]?.count || 0;

    // Search Mode
    if (query) {
      const searchTerm = `%${query.toLowerCase()}%`;
      const results = await sql`
        SELECT * FROM dictionary_words
        WHERE LOWER(word_ewe) LIKE ${searchTerm}
           OR LOWER(word_fr) LIKE ${searchTerm}
           OR LOWER(word_en) LIKE ${searchTerm}
        ORDER BY 
          CASE 
            WHEN LOWER(word_ewe) = ${query.toLowerCase()} THEN 1
            WHEN LOWER(word_fr) = ${query.toLowerCase()} THEN 2
            WHEN LOWER(word_en) = ${query.toLowerCase()} THEN 3
            ELSE 4
          END,
          word_fr IS NOT NULL DESC,
          LOWER(word_ewe) ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      return NextResponse.json({ words: results, totalCount, page, limit });
    }

    // Letter Filter Mode
    if (letter && letter !== "all") {
      const letterPattern = `${letter}%`;
      const results = await sql`
        SELECT * FROM dictionary_words
        WHERE LOWER(word_ewe) LIKE ${letterPattern}
        ORDER BY 
          word_fr IS NOT NULL DESC,
          LOWER(word_ewe) ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const letterCountResult = (await sql`
        SELECT COUNT(*)::int as count FROM dictionary_words WHERE LOWER(word_ewe) LIKE ${letterPattern}
      `) as { count: number }[];

      return NextResponse.json({ 
        words: results, 
        totalCount, 
        filteredCount: letterCountResult[0]?.count || 0,
        page, 
        limit 
      });
    }

    // Default Alphabetical Mode: Prioritize words with translations first, then alphabetical A-Z
    const words = await sql`
      SELECT * FROM dictionary_words
      ORDER BY 
        word_fr IS NOT NULL DESC,
        LOWER(word_ewe) ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({ words, totalCount, page, limit });
  } catch (error) {
    console.error("Error fetching dictionary words:", error);
    return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 });
  }
}
