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

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("Creating translation_suggestions table...");

  await sql`
    CREATE TABLE IF NOT EXISTS translation_suggestions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      word_id UUID NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL,
      user_display_name VARCHAR(255),
      suggested_fr TEXT,
      suggested_en TEXT,
      suggested_def TEXT,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      upvotes INT DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_translation_suggestions_word 
    ON translation_suggestions(word_id, status);
  `;

  console.log("✅ translation_suggestions table and index created successfully!");
}

run().catch(console.error);
