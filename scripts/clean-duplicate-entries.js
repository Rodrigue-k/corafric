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

async function cleanDuplicates() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("=== Cleaning Duplicate and Corrupted Entries in dictionary_words ===");

  // 1. Remove obvious corrupted / test entries
  console.log("1. Removing corrupted typos (e.g. 'journaïe', 'bouoche', single-letter junk)...");
  await sql`
    DELETE FROM dictionary_words
    WHERE word_fr IN ('journaïe', 'j', 'bouoche', 'assolir')
       OR (LENGTH(word_fr) = 1 AND word_fr NOT IN ('à', 'y', 'a'));
  `;

  // 2. Remove NULL translations if a translated entry already exists for that word
  console.log("2. Cleaning empty NULL translations where a verified translation exists...");
  await sql`
    DELETE FROM dictionary_words d1
    WHERE d1.word_fr IS NULL
      AND d1.audio_url IS NULL
      AND EXISTS (
        SELECT 1 FROM dictionary_words d2
        WHERE LOWER(TRIM(d2.word_ewe)) = LOWER(TRIM(d1.word_ewe))
          AND d2.word_fr IS NOT NULL
      );
  `;

  // 3. Normalize near-duplicate entries (e.g. 'bonjour (matin)' vs 'bonjour')
  // We keep the one with the richest definition / longest text
  console.log("3. Merging redundant identical meaning pairs...");
  await sql`
    DELETE FROM dictionary_words d1
    WHERE EXISTS (
      SELECT 1 FROM dictionary_words d2
      WHERE LOWER(TRIM(d2.word_ewe)) = LOWER(TRIM(d1.word_ewe))
        AND d2.id != d1.id
        AND (
          (d1.word_fr = 'bonjour' AND d2.word_fr LIKE 'bonjour%')
          OR (d1.word_fr = 'quatre' AND d2.word_fr = 'quatre (4)')
          OR (d1.word_fr = 'deux' AND d2.word_fr = 'deux (2)')
          OR (d1.word_fr = 'trois' AND d2.word_fr = 'trois (3)')
          OR (d1.word_fr = 'homme' AND d2.word_fr = 'homme' AND d2.definition IS NOT NULL AND d1.definition IS NULL)
          OR (d1.word_fr = 'femme' AND d2.word_fr = 'femme' AND d2.definition IS NOT NULL AND d1.definition IS NULL)
          OR (d1.word_fr = 'eau' AND d2.word_fr = 'eau / pluie')
          OR (d1.word_fr = 'ventre' AND d2.word_fr = 'ventre / estomac')
          OR (d1.word_fr = 'pied' AND d2.word_fr = 'pied / jambe')
          OR (d1.word_fr = 'visage' AND d2.word_fr = 'visage / face')
          OR (d1.word_fr = 'bœuf' AND d2.word_fr = 'vache / bœuf')
          OR (d1.word_fr = 'bovin' AND d2.word_fr = 'vache / bœuf')
        )
    );
  `;

  const finalStats = await sql`
    SELECT 
      COUNT(*) as total_rows, 
      COUNT(DISTINCT LOWER(TRIM(word_ewe))) as unique_ewe_words 
    FROM dictionary_words;
  `;

  console.log("\n✅ Cleaned dictionary_words successfully!");
  console.log(`Total verified clean entries: ${finalStats[0].total_rows}`);
  console.log(`Unique Éwé vocabulary: ${finalStats[0].unique_ewe_words}`);
}

cleanDuplicates().catch(console.error);
