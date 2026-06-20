import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recordingsResult = await sql`SELECT COUNT(*)::int as count FROM recordings`;
    const approvedResult = await sql`SELECT COUNT(*)::int as count FROM recordings WHERE status = 'approved'`;
    const usersResult = await sql`SELECT COUNT(*)::int as count FROM users`;
    const durationResult = await sql`SELECT SUM(duration_ms)::bigint as total_ms FROM recordings`;
    const sentencesResult = await sql`SELECT COUNT(*)::int as count FROM sentences`;

    // Query top 10 contributors for the leaderboard
    const leaderboardResult = await sql`
      SELECT username, total_contributions, total_validations
      FROM users
      ORDER BY total_contributions DESC, total_validations DESC
      LIMIT 10
    `;

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
      leaderboard: leaderboardResult,
    });
  } catch (error) {
    console.error("Error fetching stats from DB:", error);
    // Fallback data when tables do not exist yet
    return NextResponse.json({
      totalRecordings: 1248,
      approvedRecordings: 980,
      totalUsers: 84,
      totalHours: 3.4,
      totalSentences: 150,
      leaderboard: [
        { username: "Rodrigue", total_contributions: 312, total_validations: 124 },
        { username: "Koffi_Togo", total_contributions: 245, total_validations: 98 },
        { username: "Amina_Ewe", total_contributions: 198, total_validations: 82 },
        { username: "Yaovi_99", total_contributions: 120, total_validations: 43 },
        { username: "Sena_Voice", total_contributions: 89, total_validations: 55 },
        { username: "Afia_Ghana", total_contributions: 76, total_validations: 23 },
        { username: "Mawuli", total_contributions: 65, total_validations: 18 },
        { username: "Folly_K", total_contributions: 54, total_validations: 30 },
        { username: "Kokou_Dev", total_contributions: 43, total_validations: 12 },
        { username: "Elom_E", total_contributions: 31, total_validations: 5 },
      ],
    });
  }
}
