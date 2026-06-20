import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const sentenceId = formData.get("sentenceId") as string | null;
    const durationMsStr = formData.get("durationMs") as string | null;

    if (!audioFile || !sentenceId) {
      return NextResponse.json(
        { error: "Audio file and sentenceId are required" },
        { status: 400 }
      );
    }

    const durationMs = durationMsStr ? parseInt(durationMsStr, 10) : 0;
    const fileSize = audioFile.size;
    const fileKey = `${crypto.randomUUID()}.webm`;

    let audioUrl = "";

    // Upload to Cloudflare R2 S3-Compatible Storage if configured
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCOUNT_ID) {
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: "audio/webm",
        })
      );

      // Construct public URL
      const baseUrl = R2_PUBLIC_URL || `https://${R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      audioUrl = `${baseUrl}/${fileKey}`;
    } else {
      console.warn("R2 credentials not set, using mock audio URL for development.");
      audioUrl = `/mock-audio/${fileKey}`;
    }

    // Insert recording into database
    const recordingResult = await sql`
      INSERT INTO recordings (sentence_id, user_id, audio_url, duration_ms, file_size_bytes, status)
      VALUES (${sentenceId}, ${userId}, ${audioUrl}, ${durationMs}, ${fileSize}, 'pending')
      RETURNING id
    `;

    // Increment user contribution counts
    await sql`
      UPDATE users
      SET total_contributions = total_contributions + 1
      WHERE id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      recordingId: recordingResult[0].id,
      audioUrl,
    });
  } catch (error) {
    console.error("Error in POST /api/recordings/upload:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
