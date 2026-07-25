import { neon } from '@neondatabase/serverless';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  
  console.log("Creating dictionary_words table...");
  
  await sql`
    CREATE TABLE IF NOT EXISTS dictionary_words (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      word_ewe TEXT NOT NULL UNIQUE,
      word_fr TEXT,
      word_en TEXT,
      definition TEXT,
      audio_url TEXT,
      sources JSONB DEFAULT '[]'::jsonb,
      confidence_score INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  console.log("Migration successful!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
