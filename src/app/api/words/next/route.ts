import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      userId = null;
    }

    if (userId) {
      // 1. Priority: words that already have pending recordings from others to complete validation sets
      const priorityResult = (await sql`
        SELECT w.id, w.word_ewe, w.word_fr, w.word_en, w.definition
        FROM dictionary_words w
        WHERE EXISTS (
          SELECT 1 FROM recordings r 
          WHERE r.word_id = w.id AND r.status = 'pending' AND (r.user_id IS NULL OR r.user_id != ${userId})
        )
        AND NOT EXISTS (
          SELECT 1 FROM recordings ur
          WHERE ur.word_id = w.id AND ur.user_id = ${userId}
        )
        ORDER BY w.word_fr IS NOT NULL DESC, RANDOM()
        LIMIT 1
      `) as Record<string, unknown>[];

      if (priorityResult.length > 0) {
        return NextResponse.json({ word: priorityResult[0] });
      }

      // 2. Otherwise: any word not yet recorded by this user
      const unrecordedResult = (await sql`
        SELECT w.id, w.word_ewe, w.word_fr, w.word_en, w.definition
        FROM dictionary_words w
        WHERE NOT EXISTS (
          SELECT 1 FROM recordings ur
          WHERE ur.word_id = w.id AND ur.user_id = ${userId}
        )
        ORDER BY w.word_fr IS NOT NULL DESC, RANDOM()
        LIMIT 1
      `) as Record<string, unknown>[];

      if (unrecordedResult.length > 0) {
        return NextResponse.json({ word: unrecordedResult[0] });
      }

      // 3. Fallback: any word
      const fallback = (await sql`
        SELECT id, word_ewe, word_fr, word_en, definition
        FROM dictionary_words
        ORDER BY word_fr IS NOT NULL DESC, RANDOM()
        LIMIT 1
      `) as Record<string, unknown>[];

      return NextResponse.json({ word: fallback[0] || null });

    } else {
      // Anonymous / Guest mode: instant random word selection
      const result = (await sql`
        SELECT id, word_ewe, word_fr, word_en, definition
        FROM dictionary_words
        ORDER BY word_fr IS NOT NULL DESC, RANDOM()
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

