import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Ensure role and email columns exist
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'contributor';
    `;
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
    `;

    const users = await sql`
      SELECT id, username, email, country, native_language, role, total_contributions, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching team users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { targetUserId, newRole } = await request.json();
    if (!targetUserId || !["contributor", "operator", "admin"].includes(newRole)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    await sql`
      UPDATE users
      SET role = ${newRole}
      WHERE id = ${targetUserId}
    `;

    return NextResponse.json({ success: true, targetUserId, newRole });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
