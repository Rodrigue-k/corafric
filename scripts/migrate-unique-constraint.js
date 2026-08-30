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
  console.log("Creating database performance indexes...");

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_recordings_user_word ON recordings(user_id, word_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recordings_status_word ON recordings(status, word_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recordings_user_sentence ON recordings(user_id, sentence_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sentences_active_status_lang ON sentences(is_active, recording_status, language)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dictionary_words_fr ON dictionary_words(word_fr)`;
    console.log("✅ Performance indexes created successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

runMigration();
