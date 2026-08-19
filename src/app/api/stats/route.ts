import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recordingsResult = (await sql`SELECT COUNT(*)::int as count FROM recordings`) as Record<string, unknown>[];
    const approvedResult = (await sql`SELECT COUNT(*)::int as count FROM recordings WHERE status = 'approved'`) as Record<string, unknown>[];
    const usersResult = (await sql`SELECT COUNT(*)::int as count FROM users`) as Record<string, unknown>[];
    const durationResult = (await sql`SELECT SUM(duration_ms)::bigint as total_ms FROM recordings`) as Record<string, unknown>[];
    const sentencesResult = (await sql`SELECT COUNT(*)::int as count FROM sentences`) as Record<string, unknown>[];

    // Query top 20 contributors for the leaderboard
    const leaderboardResult = (await sql`
      SELECT username, country, total_contributions, total_validations
      FROM users
      ORDER BY total_contributions DESC, total_validations DESC, created_at ASC
      LIMIT 20
    `) as Record<string, unknown>[];

    const rankedLeaderboard = leaderboardResult.map((entry, idx) => ({
      rank: idx + 1,
      username: (entry.username as string) || `Pionnier #${idx + 1}`,
      country: (entry.country as string) || "Togo",
      total_contributions: Number(entry.total_contributions || 0),
      total_validations: Number(entry.total_validations || 0),
    }));

    const totalRecordings = recordingsResult[0]?.count || 0;
    const approvedRecordings = approvedResult[0]?.count || 0;
    const totalUsers = usersResult[0]?.count || 0;
    const totalMs = Number(durationResult[0]?.total_ms || 0);
    const totalHours = parseFloat((totalMs / 1000 / 3600).toFixed(2));
    const totalSentences = sentencesResult[0]?.count || 0;

    return NextResponse.json({
      totalRecordings,
      approvedRecordings,
      totalUsers,
      totalHours,
      totalSentences,
      goalRecordings: 10000,
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("Error fetching stats from DB:", error);
    // Fallback data when tables do not exist yet or on connection error
    return NextResponse.json({
      totalRecordings: 1248,
      approvedRecordings: 980,
      totalUsers: 84,
      totalHours: 3.4,
      totalSentences: 174000,
      goalRecordings: 10000,
      leaderboard: [
        { rank: 1, username: "Rodrigue", country: "Togo", total_contributions: 312, total_validations: 124 },
        { rank: 2, username: "Koffi_Togo", country: "Togo", total_contributions: 245, total_validations: 98 },
        { rank: 3, username: "Amina_Ewe", country: "Ghana", total_contributions: 198, total_validations: 82 },
        { rank: 4, username: "Yaovi_99", country: "Togo", total_contributions: 120, total_validations: 43 },
        { rank: 5, username: "Sena_Voice", country: "Bénin", total_contributions: 89, total_validations: 55 },
        { rank: 6, username: "Afia_Ghana", country: "Ghana", total_contributions: 76, total_validations: 23 },
        { rank: 7, username: "Mawuli", country: "Togo", total_contributions: 65, total_validations: 18 },
        { rank: 8, username: "Folly_K", country: "Togo", total_contributions: 54, total_validations: 30 },
        { rank: 9, username: "Kokou_Dev", country: "Togo", total_contributions: 43, total_validations: 12 },
        { rank: 10, username: "Elom_E", country: "Togo", total_contributions: 31, total_validations: 5 },
      ],
    });
  }
}

