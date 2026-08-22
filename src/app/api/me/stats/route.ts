import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User base stats
    const userStats = (await sql`
      SELECT 
        total_contributions,
        total_validations,
        created_at
      FROM users
      WHERE id = ${userId}
    `) as { total_contributions: number; total_validations: number; created_at: string }[];

    if (userStats.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Quality stats: average score received on own recordings, rejected count
    const qualityStats = (await sql`
      SELECT 
        COALESCE(AVG(r.average_score), 0)::float AS avg_score_received,
        COALESCE(SUM(r.rejected_count), 0)::int  AS total_rejected
      FROM recordings r
      WHERE r.user_id = ${userId}
        AND r.validation_count > 0
    `) as { avg_score_received: number; total_rejected: number }[];

    // Words where this user is the official voice (best recording)
    const wordsWon = (await sql`
      SELECT w.word_ewe, w.word_fr
      FROM recordings r
      JOIN dictionary_words w ON w.id = r.word_id
      WHERE r.user_id = ${userId}
        AND r.is_best_for_word = TRUE
      ORDER BY w.word_ewe ASC
    `) as { word_ewe: string; word_fr: string | null }[];

    // Rank among all contributors
    const rankResult = (await sql`
      SELECT COUNT(*) + 1 AS rank
      FROM users
      WHERE total_contributions > (
        SELECT total_contributions FROM users WHERE id = ${userId}
      )
    `) as { rank: number }[];

    return NextResponse.json({
      totalContributions: userStats[0].total_contributions,
      totalValidations: userStats[0].total_validations,
      avgScoreReceived: Math.round((qualityStats[0]?.avg_score_received ?? 0) * 10) / 10,
      totalRejected: qualityStats[0]?.total_rejected ?? 0,
      wordsWon: wordsWon.map((w) => ({ word: w.word_ewe, translation: w.word_fr })),
      rank: rankResult[0]?.rank ?? 1,
      memberSince: userStats[0].created_at,
    });
  } catch (error) {
    console.error("Error in GET /api/me/stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
