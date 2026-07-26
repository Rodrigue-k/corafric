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

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("Adding UNIQUE index on (word_ewe, word_fr) to allow homonyms with different translations...");

  try {
    // We already dropped the unique constraint on word_ewe alone in the previous step.
    // Now we create a unique index so the same word can exist if word_fr is different.
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS dictionary_words_ewe_fr_idx 
      ON dictionary_words (word_ewe, COALESCE(word_fr, ''))
    `;
    console.log("Migration successful: Added unique index.");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

runMigration();
