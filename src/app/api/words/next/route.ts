import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureDbUser } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      // Unauthenticated / guest session
      userId = null;
    }

    if (userId) {
      // Ensure DB user exists
      const clerkUser = await currentUser();
      const username = clerkUser?.username || clerkUser?.firstName || `contributeur_${userId.substring(0, 8)}`;
      await ensureDbUser(userId, username);

      // Query words prioritizing those that already have 1-2 recordings from other contributors
      // to quickly complete groups of 3 for comparative validation
      const result = (await sql`
        SELECT w.id, w.word_ewe, w.word_fr, w.word_en, w.definition,
               COUNT(all_r.id) AS existing_count
        FROM dictionary_words w
        LEFT JOIN recordings user_r ON user_r.word_id = w.id AND user_r.user_id = ${userId}
        LEFT JOIN recordings all_r ON all_r.word_id = w.id AND all_r.status = 'pending'
        WHERE user_r.id IS NULL
        GROUP BY w.id, w.word_ewe, w.word_fr, w.word_en, w.definition
        ORDER BY 
          CASE WHEN COUNT(all_r.id) BETWEEN 1 AND 2 THEN 0 ELSE 1 END,
          w.word_fr IS NOT NULL DESC,
          RANDOM()
        LIMIT 1
      `) as Record<string, unknown>[];

      if (result.length === 0) {
        // If user recorded all unrecorded, fetch any word
        const fallback = (await sql`
          SELECT id, word_ewe, word_fr, word_en, definition
          FROM dictionary_words
          ORDER BY word_fr IS NOT NULL DESC, RANDOM()
          LIMIT 1
        `) as Record<string, unknown>[];
        return NextResponse.json({ word: fallback[0] || null });
      }

      return NextResponse.json({ word: result[0] });

    } else {
      // Anonymous / Guest mode: return random word
      const result = (await sql`
        SELECT id, word_ewe, word_fr, word_en, definition
        FROM dictionary_words
        ORDER BY RANDOM()
        LIMIT 1
      `) as Record<string, unknown>[];

      if (result.length === 0) {
        return NextResponse.json({
          word: {
            id: "mock-1",
            word_ewe: "ŋdi na wò",
            word_fr: "bonjour (matin)",
            word_en: "good morning",
            definition: "Salutation matinale en langue Éwé."
          }
        });
      }

      return NextResponse.json({ word: result[0] });
    }
  } catch (error) {
    console.error("Error in GET /api/words/next:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

