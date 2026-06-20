import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recordingId, isValid } = await request.json();

    if (!recordingId || typeof isValid !== "boolean") {
      return NextResponse.json(
        { error: "recordingId and isValid (boolean) are required" },
        { status: 400 }
      );
    }

    // 1. Insert validation vote
    await sql`
      INSERT INTO validations (recording_id, user_id, is_valid)
      VALUES (${recordingId}, ${userId}, ${isValid})
      ON CONFLICT (recording_id, user_id) DO UPDATE SET is_valid = ${isValid}
    `;

    // 2. Count positive & negative validations for this recording
    const votes = await sql`
      SELECT 
        COUNT(CASE WHEN is_valid = TRUE THEN 1 END)::int as positive,
        COUNT(CASE WHEN is_valid = FALSE THEN 1 END)::int as negative
      FROM validations
      WHERE recording_id = ${recordingId}
    `;

    const positiveCount = votes[0]?.positive || 0;
    const negativeCount = votes[0]?.negative || 0;

    let newStatus = "pending";
    if (positiveCount >= 3) {
      newStatus = "approved";
    } else if (negativeCount >= 2) {
      newStatus = "rejected";
    }

    // Update status and validation count
    await sql`
      UPDATE recordings
      SET status = ${newStatus}, validation_count = ${positiveCount + negativeCount}
      WHERE id = ${recordingId}
    `;

    // 3. Increment validator total_validations
    await sql`
      UPDATE users
      SET total_validations = total_validations + 1
      WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error in POST /api/validations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
