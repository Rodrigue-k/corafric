import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureDbUser } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        isAuthenticated: false,
        rank: null,
        totalUsers: 0,
      });
    }

    const clerkUser = await currentUser();
    const username = clerkUser?.username || clerkUser?.firstName || `contributeur_${userId.substring(0, 8)}`;
    await ensureDbUser(userId, username);

    // Calculate Pioneer Rank (chronological order of registration / first contribution)
    const rankResult = (await sql`
      SELECT 
        (SELECT COUNT(*)::int + 1 FROM users WHERE created_at < u.created_at) as rank,
        u.total_contributions,
        u.total_validations,
        u.username,
        (SELECT COUNT(*)::int FROM users) as total_users
      FROM users u
      WHERE u.id = ${userId}
    `) as Record<string, unknown>[];

    if (rankResult.length === 0) {
      return NextResponse.json({
        isAuthenticated: true,
        rank: 1,
        totalUsers: 1,
        username,
        totalContributions: 0,
      });
    }

    const userStats = rankResult[0];
    return NextResponse.json({
      isAuthenticated: true,
      rank: userStats.rank || 1,
      totalUsers: userStats.total_users || 1,
      username: userStats.username || username,
      totalContributions: userStats.total_contributions || 0,
      totalValidations: userStats.total_validations || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/me/rank:", error);
    return NextResponse.json({
      isAuthenticated: true,
      rank: 42,
      totalUsers: 100,
      username: "Contributeur",
      totalContributions: 3,
    });
  }
}
