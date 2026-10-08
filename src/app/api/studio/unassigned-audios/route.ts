import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sql } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const stemsDir = path.join(process.cwd(), "public", "audios", "Stems");
    let files: string[] = [];
    if (fs.existsSync(stemsDir)) {
      files = fs.readdirSync(stemsDir).filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));
    }

    const assignedRows = await sql`
      SELECT audio_url FROM dictionary_words WHERE audio_url IS NOT NULL
    `;
    const assignedUrls = new Set(assignedRows.map(r => String(r.audio_url).trim()));

    const unassigned = files.map(filename => {
      const url = `/audios/Stems/${filename}`;
      return {
        filename,
        url,
        isAssigned: assignedUrls.has(url)
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
