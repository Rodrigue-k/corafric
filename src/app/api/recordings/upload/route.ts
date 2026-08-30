import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      userId = null;
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const sentenceId = formData.get("sentenceId") as string | null;
    const wordId = formData.get("wordId") as string | null;
    const durationMsStr = formData.get("durationMs") as string | null;

    if (!audioFile || (!sentenceId && !wordId)) {
      return NextResponse.json(
        { error: "Audio file and either sentenceId or wordId are required" },
        { status: 400 }
      );
    }

    const durationMs = durationMsStr ? parseInt(durationMsStr, 10) : 0;
    const fileSize = audioFile.size;

    // ─── Analyse automatique de qualité (rejet préventif) ───────────────────
    const isWordRecording = !!wordId;
    const maxDurationMs = isWordRecording ? 30_000 : 120_000; // 30s mot, 2min phrase

    if (fileSize < 2_000) {
      return NextResponse.json(
        { error: "QUALITY_REJECTED", reason: "L'audio est trop court ou le microphone n'a pas capté de son. Vérifiez votre micro et réessayez." },
        { status: 422 }
      );
    }
    if (fileSize > 15_000_000) {
      return NextResponse.json(
        { error: "QUALITY_REJECTED", reason: "L'audio est trop volumineux. Assurez-vous d'enregistrer dans les limites de durée autorisées." },
        { status: 422 }
      );
    }
    if (durationMs > 0 && durationMs < 300) {
      return NextResponse.json(
        { error: "QUALITY_REJECTED", reason: "L'enregistrement est trop court (moins de 0.3 secondes). Parlez plus lentement et lisez le mot en entier." },
        { status: 422 }
      );
    }
    if (durationMs > 0 && durationMs > maxDurationMs) {
      return NextResponse.json(
        { error: "QUALITY_REJECTED", reason: `L'enregistrement est trop long (maximum ${maxDurationMs / 1000}s). Enregistrez uniquement le mot demandé.` },
        { status: 422 }
      );
    }
    // ────────────────────────────────────────────────────────────────────────

    const language = "ewe";
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    let wordSlug = "audio";
    if (wordId) {
      const wordRes = (await sql`
        SELECT word_ewe FROM dictionary_words WHERE id = ${wordId}
      `) as Record<string, unknown>[];
      if (wordRes[0]?.word_ewe) {
        wordSlug = (wordRes[0].word_ewe as string)
          .toLowerCase()
          .replace(/ɔ/g, "o")
          .replace(/ɛ/g, "e")
          .replace(/ɖ/g, "d")
          .replace(/ƒ/g, "f")
          .replace(/ɣ/g, "gh")
          .replace(/ŋ/g, "ng")
          .replace(/ʋ/g, "v")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      }
    } else if (sentenceId) {
      wordSlug = "phrase";
    }

    const shortId = crypto.randomUUID().substring(0, 8);
    const fileKey = `recordings/${language}/${today}/${wordSlug}_${shortId}.webm`;

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

      // Construct accessible URL (uses /api/audio proxy route if R2_PUBLIC_URL is empty or default S3 domain)
      if (R2_PUBLIC_URL && !R2_PUBLIC_URL.includes("r2.cloudflarestorage.com")) {
        audioUrl = `${R2_PUBLIC_URL}/${fileKey}`;
      } else {
        audioUrl = `/api/audio/${fileKey}`;
      }
    } else {
      console.warn("R2 credentials not set, using mock audio URL for development.");
      audioUrl = `/mock-audio/${fileKey}`;
    }

    // Insert recording into database
    const recordingResult = (await sql`
      INSERT INTO recordings (sentence_id, word_id, user_id, audio_url, duration_ms, file_size_bytes, status)
      VALUES (${sentenceId || null}, ${wordId || null}, ${userId}, ${audioUrl}, ${durationMs}, ${fileSize}, 'pending')
      RETURNING id
    `) as Record<string, unknown>[];

    // If user is authenticated, ensure user exists and increment contribution counts atomically
    if (userId) {
      const defaultUsername = `contributeur_${userId.substring(0, 8)}`;
      await sql`
        INSERT INTO users (id, username, country, native_language, total_contributions)
        VALUES (${userId}, ${defaultUsername}, 'Togo', 'ewe', 1)
        ON CONFLICT (id) DO UPDATE 
        SET total_contributions = users.total_contributions + 1
      `;
    }

    // If recorded a sentence, update sentence status
    if (sentenceId) {
      await sql`
        UPDATE sentences
        SET recording_status = 'recorded'
        WHERE id = ${sentenceId}
      `;
    }

    return NextResponse.json({
      success: true,
      recordingId: recordingResult[0]?.id || shortId,
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

