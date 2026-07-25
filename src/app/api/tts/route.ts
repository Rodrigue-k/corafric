import { NextResponse } from "next/server";
import { textToIPA } from "@/lib/tts/ewe_rules";
import text2wav from "text2wav";

// Force Node.js runtime because text2wav relies on Node APIs and WASM
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, lang } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Currently we only support Ewe in this custom engine, 
    // but the architecture allows for future expansion.
    if (lang && lang.toLowerCase() !== "ewe" && lang.toLowerCase() !== "ee") {
      // Fallback: If not Ewe, just use standard espeak (e.g. for French/English integration later)
      // For now, we force Ewe processing.
    }

    // 1. Convert Ewe text to raw phonemes using our custom rules engine
    const ipaString = await textToIPA(text);

    // 2. Synthesize audio using text2wav (espeak-ng compiled to WASM)
    // We use a base voice like 'fr' to interpret the raw phonemes.
    const audioBuffer: Uint8Array = await text2wav(ipaString, { voice: 'fr' });

    // 3. Return the wav file as a binary stream
    const buffer = Buffer.from(audioBuffer);
    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable", // Cache the audio aggressively
      },
    });

  } catch (error) {
    console.error("TTS Engine Error:", error);
    return NextResponse.json(
      { error: "Failed to generate text-to-speech audio" },
      { status: 500 }
    );
  }
}
