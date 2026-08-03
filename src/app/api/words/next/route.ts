import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureDbUser } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure DB user exists
    const clerkUser = await currentUser();
    const username = clerkUser?.username || clerkUser?.firstName || `contributeur_${userId.substring(0, 8)}`;
    await ensureDbUser(userId, username);

    // Query words from dictionary_words that have NOT been recorded by this user
    const result = (await sql`
      SELECT w.id, w.word_ewe, w.word_fr, w.word_en, w.definition
      FROM dictionary_words w
      LEFT JOIN recordings r ON r.word_id = w.id AND r.user_id = ${userId}
      WHERE r.id IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `) as Record<string, unknown>[];

    if (result.length === 0) {
      return NextResponse.json({ word: null, message: "Tous les mots ont été enregistrés !" });
    }

    return NextResponse.json({ word: result[0] });
  } catch (error) {
    console.error("Error in GET /api/words/next:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
