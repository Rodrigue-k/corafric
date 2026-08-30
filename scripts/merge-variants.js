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

async function mergeVariants() {
  const sql = neon(process.env.DATABASE_URL);

  // Group by (LOWER(TRIM(word_ewe))) and remove shorter substring translations when a richer translation exists
  const duplicates = await sql`
    SELECT id, LOWER(TRIM(word_ewe)) as ewe, word_fr, definition
    FROM dictionary_words
    ORDER BY word_ewe, LENGTH(COALESCE(word_fr, '')) DESC;
  `;

  const seen = new Map();
  const toDelete = [];

  for (const item of duplicates) {
    const key = item.ewe;
    if (!seen.has(key)) {
      seen.set(key, item);
    } else {
      const existing = seen.get(key);
      // If one of the meanings is a substring of the other (e.g. 'grand' vs 'grand / vaste / important')
      if (
        existing.word_fr && item.word_fr &&
        (existing.word_fr.includes(item.word_fr) || item.word_fr.includes(existing.word_fr))
      ) {
        toDelete.push(item.id);
      }
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} redundant substring duplicate entries...`);
    await sql`
      DELETE FROM dictionary_words
      WHERE id = ANY(${toDelete});
    `;
  }

  const finalStats = await sql`
    SELECT 
      COUNT(*) as total_rows, 
      COUNT(DISTINCT LOWER(TRIM(word_ewe))) as unique_ewe_words 
    FROM dictionary_words;
  `;

  console.log(`✅ Refined clean dictionary! Total entries: ${finalStats[0].total_rows}, Unique Éwé: ${finalStats[0].unique_ewe_words}`);
}

mergeVariants().catch(console.error);
