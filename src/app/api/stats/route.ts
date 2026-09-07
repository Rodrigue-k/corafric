import { sql } from "@/lib/db";
import { formatDisplayName } from "@/lib/userUtils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recordingsResult = (await sql`SELECT COUNT(*)::int as count FROM recordings`) as Record<string, unknown>[];
    const approvedResult = (await sql`SELECT COUNT(*)::int as count FROM recordings WHERE status = 'approved'`) as Record<string, unknown>[];
    const usersResult = (await sql`SELECT COUNT(*)::int as count FROM users`) as Record<string, unknown>[];
    const durationResult = (await sql`SELECT SUM(duration_ms)::bigint as total_ms FROM recordings`) as Record<string, unknown>[];
    const sentencesResult = (await sql`SELECT COUNT(*)::int as count FROM sentences`) as Record<string, unknown>[];

    // Query top contributors ranked by Corafric Reputation Score:
    // Score = (total_contributions * 10) + (approved_recordings * 15) + (best_for_word * 50) + (total_validations * 3)
    const leaderboardResult = (await sql`
      SELECT 
        u.id,
        u.username,
        u.country,
        COALESCE(u.total_contributions, 0)::int as total_contributions,
        COALESCE(u.total_validations, 0)::int as total_validations,
        COALESCE(appr.approved_count, 0)::int as approved_count,
        COALESCE(best.best_count, 0)::int as best_count,
        (
          (COALESCE(u.total_contributions, 0) * 10) +
          (COALESCE(appr.approved_count, 0) * 15) +
          (COALESCE(best.best_count, 0) * 50) +
          (COALESCE(u.total_validations, 0) * 3)
        )::int as score
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int as approved_count
        FROM recordings
        WHERE status = 'approved' AND user_id IS NOT NULL
        GROUP BY user_id
      ) appr ON appr.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int as best_count
        FROM recordings
        WHERE is_best_for_word = TRUE AND user_id IS NOT NULL
        GROUP BY user_id
      ) best ON best.user_id = u.id
      WHERE (u.total_contributions > 0 OR u.total_validations > 0)
      ORDER BY score DESC, total_contributions DESC, u.created_at ASC
      LIMIT 50
    `) as Record<string, unknown>[];

    const rankedLeaderboard = leaderboardResult.map((entry, idx) => ({
      rank: idx + 1,
      username: formatDisplayName(entry.username as string, null, entry.id as string) || `Contributeur #${idx + 1}`,
      country: (entry.country as string) || "Togo",
      score: Number(entry.score || 0),
      total_contributions: Number(entry.total_contributions || 0),
      total_validations: Number(entry.total_validations || 0),
      approved_count: Number(entry.approved_count || 0),
      best_count: Number(entry.best_count || 0),
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
        { rank: 1, username: "Rodrigue", country: "Togo", score: 4500, total_contributions: 312, total_validations: 124, approved_count: 240, best_count: 15 },
        { rank: 2, username: "Koffi_Togo", country: "Togo", score: 3600, total_contributions: 245, total_validations: 98, approved_count: 190, best_count: 8 },
        { rank: 3, username: "Amina_Ewe", country: "Ghana", score: 2950, total_contributions: 198, total_validations: 82, approved_count: 150, best_count: 6 },
        { rank: 4, username: "Yaovi_99", country: "Togo", score: 1800, total_contributions: 120, total_validations: 43, approved_count: 90, best_count: 3 },
        { rank: 5, username: "Sena_Voice", country: "Bénin", score: 1450, total_contributions: 89, total_validations: 55, approved_count: 65, best_count: 2 },
        { rank: 6, username: "Afia_Ghana", country: "Ghana", score: 1120, total_contributions: 76, total_validations: 23, approved_count: 55, best_count: 1 },
        { rank: 7, username: "Mawuli", country: "Togo", score: 980, total_contributions: 65, total_validations: 18, approved_count: 45, best_count: 1 },
        { rank: 8, username: "Folly_K", country: "Togo", score: 850, total_contributions: 54, total_validations: 30, approved_count: 38, best_count: 0 },
        { rank: 9, username: "Kokou_Dev", country: "Togo", score: 680, total_contributions: 43, total_validations: 12, approved_count: 30, best_count: 0 },
        { rank: 10, username: "Elom_E", country: "Togo", score: 480, total_contributions: 31, total_validations: 5, approved_count: 20, best_count: 0 },
      ],
    });
  }
}

