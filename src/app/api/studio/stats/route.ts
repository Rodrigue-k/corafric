import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    const [stats] = (await sql`
      SELECT 
        COUNT(CASE WHEN r.is_studio = TRUE THEN 1 END)::int AS studio_recordings,
        COUNT(r.id)::int AS total_recordings,
        COALESCE(SUM(CASE WHEN r.is_studio = TRUE THEN r.duration_ms ELSE 0 END), 0)::bigint AS studio_duration_ms,
        COUNT(CASE WHEN r.created_at >= CURRENT_DATE THEN 1 END)::int AS today_recordings
      FROM recordings r
    `) as { studio_recordings: number; total_recordings: number; studio_duration_ms: number; today_recordings: number }[];

    const [sentenceCounts] = (await sql`
      SELECT 
        COUNT(CASE WHEN is_active = TRUE AND is_flagged = FALSE THEN 1 END)::int AS available_sentences,
        COUNT(CASE WHEN recording_status = 'recorded' THEN 1 END)::int AS recorded_sentences,
        COUNT(CASE WHEN is_flagged = TRUE THEN 1 END)::int AS flagged_sentences
      FROM sentences
    `) as { available_sentences: number; recorded_sentences: number; flagged_sentences: number }[];

    return NextResponse.json({
      studioRecordings: stats?.studio_recordings || 0,
      totalRecordings: stats?.total_recordings || 0,
      todayRecordings: stats?.today_recordings || 0,
      totalDurationSeconds: Math.round((Number(stats?.studio_duration_ms || 0)) / 1000),
      availableSentences: sentenceCounts?.available_sentences || 0,
      recordedSentences: sentenceCounts?.recorded_sentences || 0,
      flaggedSentences: sentenceCounts?.flagged_sentences || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/studio/stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
