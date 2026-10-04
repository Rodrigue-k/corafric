import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const wordId = formData.get("wordId") as string | null;
    const trackNumber = formData.get("trackNumber") as string | null;
    const speakerGender = formData.get("speakerGender") as string | null;
    const speakerAgeGroup = formData.get("speakerAgeGroup") as string | null;
    const dialectVariant = formData.get("dialectVariant") as string | null;
    const micType = formData.get("micType") as string | null;

    if (!audioFile || !wordId) {
      return NextResponse.json(
        { error: "Fichier audio et wordId requis." },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = audioFile.size;

    // Fetch word info
    const wordRes = (await sql`
      SELECT word_ewe FROM dictionary_words WHERE id = ${wordId}
    `) as Record<string, unknown>[];

    let wordSlug = "mot";
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

    const today = new Date().toISOString().split("T")[0];
    const shortId = crypto.randomUUID().substring(0, 8);
    const trackPrefix = trackNumber ? `piste_${trackNumber.padStart(3, "0")}_` : "";
    const fileKey = `recordings/ewe/${today}/${trackPrefix}${wordSlug}_${shortId}.webm`;

    let audioUrl = "";

    // Upload to Cloudflare R2
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCOUNT_ID) {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: audioFile.type || "audio/webm",
        })
      );

      if (R2_PUBLIC_URL && !R2_PUBLIC_URL.includes("r2.cloudflarestorage.com")) {
        audioUrl = `${R2_PUBLIC_URL}/${fileKey}`;
      } else {
        audioUrl = `/api/audio/${fileKey}`;
      }
    } else {
      audioUrl = `/mock-audio/${fileKey}`;
    }

    // 1. Insert into recordings table as a studio recording
    await sql`
      INSERT INTO recordings (
        word_id,
        audio_url,
        file_size_bytes,
        status,
        speaker_gender,
        speaker_age_group,
        dialect_variant,
        mic_type,
        is_studio
      ) VALUES (
        ${wordId},
        ${audioUrl},
        ${fileSize},
        'validated',
        ${speakerGender || 'studio'},
        ${speakerAgeGroup || '30-49'},
        ${dialectVariant || 'ewe_lome'},
        ${micType || 'studio_xlr_usb'},
        TRUE
      )
    `;

    // 2. Update dictionary_words audio_url directly
    await sql`
      UPDATE dictionary_words
      SET audio_url = ${audioUrl}, updated_at = NOW()
      WHERE id = ${wordId}
    `;

    return NextResponse.json({
      success: true,
      wordId,
      trackNumber,
      audioUrl,
    });
  } catch (error) {
    console.error("Error in POST /api/studio/upload-track:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
