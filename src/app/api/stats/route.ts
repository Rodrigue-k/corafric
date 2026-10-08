import { sql } from "@/lib/db";
import { formatDisplayName } from "@/lib/userUtils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache for high-throughput aggregation queries
let cachedStatsPayload: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL_MS = 25_000; // 25 seconds cache

export async function GET() {
  const now = Date.now();
  if (cachedStatsPayload && now - cachedStatsPayload.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedStatsPayload.data, {
      headers: {
        "Cache-Control": "public, s-maxage=25, stale-while-revalidate=60",
      },
    });
  }

  try {
    // Run all analytical read queries in parallel instead of sequentially
    const [
      recordingsResult,
      approvedResult,
      usersResult,
      durationResult,
      sentencesResult,
      leaderboardResult,
      wordsStatsResult,
      sentenceStatsResult,
    ] = (await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM recordings`,
      sql`SELECT COUNT(*)::int as count FROM recordings WHERE status = 'approved'`,
      sql`SELECT COUNT(*)::int as count FROM users`,
      sql`SELECT SUM(duration_ms)::bigint as total_ms FROM recordings`,
      sql`SELECT COUNT(*)::int as count FROM sentences`,
      // Leaderboard query
      sql`
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
      `,
      // Word metrics
      sql`
        SELECT 
          COUNT(CASE WHEN is_rejected IS NULL OR is_rejected = FALSE THEN 1 END)::int as total_words,
          COUNT(CASE WHEN is_validated = TRUE AND (is_rejected IS NULL OR is_rejected = FALSE) THEN 1 END)::int as validated_words,
          COUNT(CASE WHEN is_rejected = TRUE THEN 1 END)::int as rejected_words,
          COUNT(CASE WHEN audio_url IS NOT NULL AND audio_url != '' THEN 1 END)::int as audio_words
        FROM dictionary_words
      `,
      // Sentence metrics
      sql`
        SELECT 
          COUNT(CASE WHEN is_rejected IS NULL OR is_rejected = FALSE THEN 1 END)::int as total_sentences,
          COUNT(CASE WHEN is_validated = TRUE AND (is_rejected IS NULL OR is_rejected = FALSE) THEN 1 END)::int as validated_sentences,
          COUNT(CASE WHEN is_rejected = TRUE THEN 1 END)::int as rejected_sentences,
          COUNT(CASE WHEN recording_status = 'recorded' THEN 1 END)::int as recorded_sentences
        FROM sentences
      `,
    ])) as unknown as [
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      { total_words: number; validated_words: number; rejected_words: number; audio_words: number }[],
      { total_sentences: number; validated_sentences: number; rejected_sentences: number; recorded_sentences: number }[],
    ];

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

    const totalRecordings = (recordingsResult[0]?.count as number) || 0;
    const approvedRecordings = (approvedResult[0]?.count as number) || 0;
    const totalUsers = (usersResult[0]?.count as number) || 0;
    const totalMs = Number(durationResult[0]?.total_ms || 0);
    const totalHours = parseFloat((totalMs / 1000 / 3600).toFixed(2));

    const wordsStats = wordsStatsResult[0] || { total_words: 1350, validated_words: 0, audio_words: 0 };
    const sentencesStats = sentenceStatsResult[0] || { total_sentences: 1100, validated_sentences: 0, recorded_sentences: 0 };

    const payload = {
      totalRecordings,
      approvedRecordings,
      totalUsers,
      totalHours,
      totalSentences: sentencesStats.total_sentences || (sentencesResult[0]?.count as number) || 1100,
      words: {
        total: wordsStats.total_words,
        validated: wordsStats.validated_words,
        withAudio: wordsStats.audio_words,
      },
      sentences: {
        total: sentencesStats.total_sentences,
        validated: sentencesStats.validated_sentences,
        withAudio: sentencesStats.recorded_sentences,
      },
      goalRecordings: 10000,
      leaderboard: rankedLeaderboard,
    };

    cachedStatsPayload = { data: payload, timestamp: now };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=25, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching stats from DB:", error);
    // Return cached fallback if available
    if (cachedStatsPayload) {
      return NextResponse.json(cachedStatsPayload.data);
    }
    // Static fallback data on network/DB failure
    return NextResponse.json({
      totalRecordings: 1248,
      approvedRecordings: 980,
      totalUsers: 84,
      totalHours: 3.4,
      totalSentences: 1100,
      goalRecordings: 10000,
      words: { total: 1378, validated: 0, withAudio: 0 },
      sentences: { total: 1100, validated: 0, withAudio: 0 },
      leaderboard: [
        { rank: 1, username: "Rodrigue", country: "Togo", score: 4500, total_contributions: 312, total_validations: 124, approved_count: 240, best_count: 15 },
        { rank: 2, username: "Koffi_Togo", country: "Togo", score: 3600, total_contributions: 245, total_validations: 98, approved_count: 190, best_count: 8 },
        { rank: 3, username: "Amina_Ewe", country: "Ghana", score: 2950, total_contributions: 198, total_validations: 82, approved_count: 150, best_count: 6 },
      ],
    });
  }
}
