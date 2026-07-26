import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    // Get total count of words in dictionary
    const countResult = (await sql`SELECT COUNT(*)::int as count FROM dictionary_words`) as { count: number }[];
    const totalCount = countResult[0]?.count || 0;

    if (!query) {
      // Return top words or recently added words
      const words = await sql`
        SELECT * FROM dictionary_words
        ORDER BY confidence_score DESC, created_at DESC
        LIMIT 50
      `;
      return NextResponse.json({ words, totalCount });
    }

    // Search across all languages (Ewe, FR, EN)
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
        confidence_score DESC
      LIMIT 20
    `;

    return NextResponse.json({ words: results, totalCount });
  } catch (error) {
    console.error("Error fetching dictionary words:", error);
    return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 });
  }
}
