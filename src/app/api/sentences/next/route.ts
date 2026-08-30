import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language") || "ewe";

    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      userId = null;
    }

    if (userId) {
      // Query sentences that are active, match language, and have NOT been recorded by this user
      const result = (await sql`
        SELECT s.id, s.text, s.translation_fr, s.language, s.source
        FROM sentences s
        WHERE s.is_active = TRUE
          AND s.language = ${language}
          AND s.recording_status = 'pending'
          AND NOT EXISTS (
            SELECT 1 FROM recordings r WHERE r.sentence_id = s.id AND r.user_id = ${userId}
          )
        ORDER BY RANDOM()
        LIMIT 1
      `) as Record<string, unknown>[];

      if (result.length === 0) {
        // Fallback to any active sentence
        const fallback = (await sql`
          SELECT s.id, s.text, s.translation_fr, s.language, s.source
          FROM sentences s
          WHERE s.is_active = TRUE
            AND s.language = ${language}
          ORDER BY RANDOM()
          LIMIT 1
        `) as Record<string, unknown>[];
        return NextResponse.json({ sentence: fallback[0] || null });
      }

      return NextResponse.json({ sentence: result[0] });
    } else {
      // Guest / Anonymous user: return random active sentence
      const result = (await sql`
        SELECT s.id, s.text, s.translation_fr, s.language, s.source
        FROM sentences s
        WHERE s.is_active = TRUE
          AND s.language = ${language}
          AND s.recording_status = 'pending'
        ORDER BY RANDOM()
        LIMIT 1
      `) as Record<string, unknown>[];

      if (result.length === 0) {
        const fallback = (await sql`
          SELECT s.id, s.text, s.translation_fr, s.language, s.source
          FROM sentences s
          WHERE s.is_active = TRUE
            AND s.language = ${language}
          ORDER BY RANDOM()
          LIMIT 1
        `) as Record<string, unknown>[];

        if (fallback.length === 0) {
          return NextResponse.json({
            sentence: {
              id: "mock-1",
              text: "Akpe kaka na mi katã.",
              translation_fr: "Merci beaucoup à vous tous.",
              language: "ewe",
              source: "system"
            }
          });
        }
        return NextResponse.json({ sentence: fallback[0] });
      }

      return NextResponse.json({ sentence: result[0] });
    }
  } catch (error) {
    console.error("Error in GET /api/sentences/next:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

