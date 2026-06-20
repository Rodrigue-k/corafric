import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureDbUser } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current Clerk user's profile to sync username
    const clerkUser = await currentUser();
    const username = clerkUser?.username || clerkUser?.firstName || `contributeur_${userId.substring(0, 8)}`;
    await ensureDbUser(userId, username);

    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language") || "ewe";

    // Query sentences that are active, match language, and have NOT been recorded by this user
    const result = await sql`
      SELECT s.id, s.text, s.language, s.source
      FROM sentences s
      LEFT JOIN recordings r ON r.sentence_id = s.id AND r.user_id = ${userId}
      WHERE s.is_active = TRUE
        AND s.language = ${language}
        AND r.id IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ sentence: null, message: "Toutes les phrases ont été enregistrées !" });
    }

    return NextResponse.json({ sentence: result[0] });
  } catch (error) {
    console.error("Error in GET /api/sentences/next:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
