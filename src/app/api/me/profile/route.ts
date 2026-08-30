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

    const rows = (await sql`
      SELECT id, username, country, native_language, created_at
      FROM users
      WHERE id = ${userId}
    `) as { id: string; username: string | null; country: string | null; native_language: string | null; created_at: string }[];

    if (rows.length === 0) {
      return NextResponse.json({ username: null });
    }

    return NextResponse.json({
      id: rows[0].id,
      username: rows[0].username,
      country: rows[0].country,
      nativeLanguage: rows[0].native_language,
    });
  } catch (error) {
    console.error("Error in GET /api/me/profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Le pseudo ne peut pas être vide." },
        { status: 400 }
      );
    }

    // Sanitize username: allow letters, numbers, hyphens, underscores, dots (max 30 chars)
    const cleaned = username
      .trim()
      .replace(/[^a-zA-Z0-9_\-\.]/g, "")
      .slice(0, 30);

    if (cleaned.length < 2) {
      return NextResponse.json(
        { error: "Le pseudo doit contenir au moins 2 caractères valides." },
        { status: 400 }
      );
    }

    // Upsert into users table
    await sql`
      INSERT INTO users (id, username, country, native_language)
      VALUES (${userId}, ${cleaned}, 'Togo', 'ewe')
      ON CONFLICT (id) DO UPDATE SET 
        username = ${cleaned}
    `;

    return NextResponse.json({
      success: true,
      username: cleaned,
      message: "Pseudo public mis à jour avec succès.",
    });
  } catch (error) {
    console.error("Error in PATCH /api/me/profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
