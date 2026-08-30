const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
  if (dbUrlMatch) {
    process.env.DATABASE_URL = dbUrlMatch[1].trim();
  }
}

const ALPHABET_DATA = [
  { char: "a", name_fr: "Lettre A", name_en: "Letter A", desc: "Voyelle ouverte antérieure" },
  { char: "b", name_fr: "Lettre B", name_en: "Letter B", desc: "Consonne occlusive bilabiale voisée" },
  { char: "d", name_fr: "Lettre D", name_en: "Letter D", desc: "Consonne occlusive alvéolaire voisée" },
  { char: "ɖ", name_fr: "Lettre Ɖ (d rétroflexe)", name_en: "Letter Ɖ", desc: "Consonne occlusive rétroflexe voisée" },
  { char: "e", name_fr: "Lettre E", name_en: "Letter E", desc: "Voyelle fermée antérieure non arrondie" },
  { char: "ɛ", name_fr: "Lettre Ɛ (e ouvert)", name_en: "Letter Ɛ", desc: "Voyelle mi-ouverte antérieure non arrondie" },
  { char: "f", name_fr: "Lettre F", name_en: "Letter F", desc: "Consonne fricative labio-dentale sourde" },
  { char: "ƒ", name_fr: "Lettre Ƒ (f bilabial)", name_en: "Letter Ƒ", desc: "Consonne fricative bilabiale sourde" },
  { char: "g", name_fr: "Lettre G", name_en: "Letter G", desc: "Consonne occlusive vélaire voisée" },
  { char: "ɣ", name_fr: "Lettre Ɣ (gh vélaire)", name_en: "Letter Ɣ", desc: "Consonne fricative vélaire voisée" },
  { char: "h", name_fr: "Lettre H", name_en: "Letter H", desc: "Consonne fricative glottale sourde" },
  { char: "i", name_fr: "Lettre I", name_en: "Letter I", desc: "Voyelle fermée antérieure non arrondie" },
  { char: "k", name_fr: "Lettre K", name_en: "Letter K", desc: "Consonne occlusive vélaire sourde" },
  { char: "l", name_fr: "Lettre L", name_en: "Letter L", desc: "Consonne spirante latérale alvéolaire voisée" },
  { char: "m", name_fr: "Lettre M", name_en: "Letter M", desc: "Consonne nasale bilabiale voisée" },
  { char: "n", name_fr: "Lettre N", name_en: "Letter N", desc: "Consonne nasale alvéolaire voisée" },
  { char: "ŋ", name_fr: "Lettre Ŋ (ng nasal)", name_en: "Letter Ŋ", desc: "Consonne nasale vélaire voisée" },
  { char: "o", name_fr: "Lettre O", name_en: "Letter O", desc: "Voyelle fermée postérieure arrondie" },
  { char: "ɔ", name_fr: "Lettre Ɔ (o ouvert)", name_en: "Letter Ɔ", desc: "Voyelle mi-ouverte postérieure arrondie" },
  { char: "p", name_fr: "Lettre P", name_en: "Letter P", desc: "Consonne occlusive bilabiale sourde" },
  { char: "r", name_fr: "Lettre R", name_en: "Letter R", desc: "Consonne roulée alvéolaire voisée" },
  { char: "s", name_fr: "Lettre S", name_en: "Letter S", desc: "Consonne fricative alvéolaire sourde" },
  { char: "t", name_fr: "Lettre T", name_en: "Letter T", desc: "Consonne occlusive alvéolaire sourde" },
  { char: "u", name_fr: "Lettre U", name_en: "Letter U", desc: "Voyelle fermée postérieure arrondie" },
  { char: "v", name_fr: "Lettre V", name_en: "Letter V", desc: "Consonne fricative labio-dentale voisée" },
  { char: "ʋ", name_fr: "Lettre Ʋ (v bilabial)", name_en: "Letter Ʋ", desc: "Consonne fricative bilabiale voisée" },
  { char: "w", name_fr: "Lettre W", name_en: "Letter W", desc: "Consonne spirante labio-vélaire voisée" },
  { char: "x", name_fr: "Lettre X", name_en: "Letter X", desc: "Consonne fricative vélaire sourde" },
  { char: "y", name_fr: "Lettre Y", name_en: "Letter Y", desc: "Consonne spirante palatale voisée" },
  { char: "z", name_fr: "Lettre Z", name_en: "Letter Z", desc: "Consonne fricative alvéolaire voisée" }
];

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("Seeding all 30 alphabet letters with physical audio into dictionary_words...");

  try {
    for (const item of ALPHABET_DATA) {
      const audioPath = `/audios/${item.char}.mp4`;
      await sql`DELETE FROM dictionary_words WHERE word_ewe = ${item.char}`;
      await sql`
        INSERT INTO dictionary_words (word_ewe, word_fr, word_en, definition, audio_url, confidence_score)
        VALUES (${item.char}, ${item.name_fr}, ${item.name_en}, ${item.desc}, ${audioPath}, 5)
      `;
      console.log(`[+] Seeded alphabet letter: ${item.char} -> ${audioPath}`);
    }

    const count = await sql`SELECT COUNT(*) FROM dictionary_words WHERE audio_url IS NOT NULL`;
    console.log(`✅ Alphabet audio seeding complete! Total words/letters with direct audio: ${count[0].count}`);
  } catch (err) {
    console.error("Migration error:", err);
  }
}

runMigration();
