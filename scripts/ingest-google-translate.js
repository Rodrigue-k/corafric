const { neon } = require('@neondatabase/serverless');
const { translate } = require('@vitalets/google-translate-api');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
  if (dbUrlMatch) {
    process.env.DATABASE_URL = dbUrlMatch[1].trim();
  }
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Please set it in .env");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log("Connected to Neon DB. Extracting frequent Ewe vocabulary from 174k corpus...");

  // 1. Extract vocabulary from sentences
  const rows = await sql`SELECT text FROM sentences WHERE text IS NOT NULL LIMIT 40000`;
  const freqMap = new Map();
  const ewePatt = /^[a-zɖɛƒɣŋɔʋ\-]+$/i;

  for (const row of rows) {
    if (!row.text) continue;
    const clean = row.text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\_`~()?"'«»“”0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = clean.split(' ');
    for (let w of words) {
      w = w.trim();
      if (w.length >= 2 && w.length <= 20 && ewePatt.test(w)) {
        freqMap.set(w, (freqMap.get(w) || 0) + 1);
      }
    }
  }

  // Filter words that occur at least 10 times in the corpus
  const sortedWords = Array.from(freqMap.entries())
    .filter(([_, count]) => count >= 10)
    .sort((a, b) => b[1] - a[1]);

  console.log(`Extracted ${sortedWords.length} high-frequency Ewe vocabulary terms.`);

  // Get existing words in dictionary
  const existing = await sql`SELECT word_ewe FROM dictionary_words WHERE word_fr IS NOT NULL`;
  const existingSet = new Set(existing.map(r => r.word_ewe.toLowerCase()));

  const wordsToTranslate = sortedWords
    .filter(([w]) => !existingSet.has(w))
    .slice(0, 250); // Translate 250 new terms

  console.log(`Starting translation for ${wordsToTranslate.length} new words...`);

  let successCount = 0;
  for (let i = 0; i < wordsToTranslate.length; i++) {
    const [wordEwe, freq] = wordsToTranslate[i];

    try {
      // Translate Ewe -> French
      const resFr = await translate(wordEwe, { from: 'ee', to: 'fr' });
      const wordFr = resFr.text.trim().toLowerCase();

      // Translate Ewe -> English
      const resEn = await translate(wordEwe, { from: 'ee', to: 'en' });
      const wordEn = resEn.text.trim().toLowerCase();

      // Only insert if translation is valid and not identical to raw word (not untranslated)
      if (wordFr && wordFr !== wordEwe && !wordFr.includes("error")) {
        await sql`
          INSERT INTO dictionary_words (word_ewe, word_fr, word_en, audio_url, sources, confidence_score)
          VALUES (
            ${wordEwe}, 
            ${wordFr}, 
            ${wordEn}, 
            NULL, 
            '["google-translate", "corpus-frequency"]'::jsonb, 
            3
          )
          ON CONFLICT (word_ewe, COALESCE(word_fr, '')) DO UPDATE SET 
            word_en = EXCLUDED.word_en,
            sources = '["google-translate", "corpus-frequency"]'::jsonb,
            confidence_score = 3
        `;
        successCount++;
        console.log(`[${i + 1}/${wordsToTranslate.length}] (+) EWE: ${wordEwe} -> FR: ${wordFr} | EN: ${wordEn} (freq: ${freq})`);
      }

      // Small throttle to avoid Google Translate rate limits
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.warn(`[!] Skip "${wordEwe}":`, err.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const total = await sql`SELECT COUNT(*) FROM dictionary_words WHERE word_fr IS NOT NULL`;
  console.log(`\n✅ Ingestion complete! Successfully added ${successCount} terms.`);
  console.log(`Total words with translations in dictionary: ${total[0].count}`);
}

run().catch(console.error);
