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

async function checkDuplicates() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("=== Checking for Duplicates in dictionary_words ===");

  const total = await sql`
    SELECT 
      COUNT(*) as total_rows, 
      COUNT(DISTINCT LOWER(TRIM(word_ewe))) as unique_ewe_words 
    FROM dictionary_words;
  `;
  console.log(`Total rows: ${total[0].total_rows}`);
  console.log(`Unique Éwé words: ${total[0].unique_ewe_words}`);

  const duplicates = await sql`
    SELECT LOWER(TRIM(word_ewe)) as ewe, COUNT(*) as count, ARRAY_AGG(COALESCE(word_fr, 'NULL')) as fr_translations
    FROM dictionary_words
    GROUP BY LOWER(TRIM(word_ewe))
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 25;
  `;

  if (duplicates.length === 0) {
    console.log("✅ PERFECT: Zero duplicate words found in dictionary_words!");
  } else {
    console.log(`\nFound ${duplicates.length} words with multiple meanings/entries (homonyms/polysemy):`);
    duplicates.forEach(d => {
      console.log(` - "${d.ewe}" (${d.count} entries): [${d.fr_translations.join(' | ')}]`);
    });
  }
}

checkDuplicates().catch(console.error);
