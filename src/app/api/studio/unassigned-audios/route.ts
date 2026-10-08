import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sql } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";
import stemsManifest from "@/lib/stemsManifest.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // 1. Get files from static manifest first (guaranteed on Vercel Serverless)
    let files: string[] = Array.isArray(stemsManifest) ? [...stemsManifest] : [];

    // 2. Fallback / supplement with disk if available
    try {
      const stemsDir = path.join(process.cwd(), "public", "audios", "Stems");
      if (fs.existsSync(stemsDir)) {
        const diskFiles = fs.readdirSync(stemsDir).filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));
        if (diskFiles.length > 0) {
          files = Array.from(new Set([...files, ...diskFiles]));
        }
      }
    } catch {
      // Ignore disk error in read-only / serverless environment
    }

    // 3. Query all currently assigned audios from DB
    const assignedRows = await sql`
      SELECT audio_url FROM dictionary_words WHERE audio_url IS NOT NULL AND audio_url != ''
    `;
    const assignedUrls = new Set(assignedRows.map(r => decodeURI(String(r.audio_url).trim())));

    // 4. Filter out assigned stems
    const unassigned = files.map(filename => {
      const url = `/api/audio/stems/${filename}`;
      const legacyUrl = `/audios/Stems/${filename}`;
      const isAssigned = 
        assignedUrls.has(url) || 
        assignedUrls.has(encodeURI(url)) ||
        assignedUrls.has(legacyUrl) ||
        assignedUrls.has(encodeURI(legacyUrl));
      return {
        filename,
        url,
        isAssigned
      };
    }).filter(f => !f.isAssigned);

    unassigned.sort((a, b) => {
      const numA = parseInt(a.filename.match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(b.filename.match(/\d+/)?.[0] || "0", 10);
      return numA - numB;
    });

    return NextResponse.json({ audios: unassigned });
  } catch (error) {
    console.error("Error reading unassigned audios:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
