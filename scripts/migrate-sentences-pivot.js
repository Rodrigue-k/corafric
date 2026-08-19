const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1].trim() : null;

if (!databaseUrl) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function run() {
  console.log('Running sentences & recordings migration...');
  try {
    // 1. Deduplicate sentences on text
    await sql.query(`
      DELETE FROM sentences a USING sentences b
      WHERE a.id > b.id AND a.text = b.text
    `);

    // 2. Create unique index on sentences text
    await sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS sentences_text_idx ON sentences(text)
    `);

    // 3. Add columns to sentences
    await sql.query(`
      ALTER TABLE sentences ADD COLUMN IF NOT EXISTS translation_fr TEXT
    `);
    await sql.query(`
      ALTER TABLE sentences ADD COLUMN IF NOT EXISTS recording_status TEXT DEFAULT 'pending'
    `);
    await sql.query(`
      CREATE INDEX IF NOT EXISTS idx_sentences_status ON sentences(recording_status)
    `);
    await sql.query(`
      CREATE INDEX IF NOT EXISTS idx_sentences_active_lang ON sentences(is_active, language)
    `);

    // 4. Update recordings table
    await sql.query(`
      ALTER TABLE recordings ADD COLUMN IF NOT EXISTS word_id UUID REFERENCES dictionary_words(id) ON DELETE CASCADE
    `);
    await sql.query(`
      ALTER TABLE recordings ALTER COLUMN sentence_id DROP NOT NULL
    `);
    await sql.query(`
      ALTER TABLE recordings ALTER COLUMN user_id DROP NOT NULL
    `);

    console.log('Migration complete successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
