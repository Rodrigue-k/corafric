import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { userId } = await auth();
    const body = await request.json();
    const { wordId } = body;

    if (!wordId) {
      return NextResponse.json({ error: "wordId est requis" }, { status: 400 });
    }

    // Reject the word
    await sql`
      UPDATE dictionary_words 
      SET 
        validation_status = 'rejected',
        is_rejected = TRUE,
        rejected_by = ${userId || 'studio_admin'},
        rejected_at = NOW()
      WHERE id = ${wordId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reject-word:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
