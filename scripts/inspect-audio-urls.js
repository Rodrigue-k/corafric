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

async function inspectAudio() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT id, word_ewe, audio_url FROM dictionary_words WHERE audio_url IS NOT NULL LIMIT 20;`;
  console.log(`Found ${rows.length} words with audio_url:`);
  console.log(rows);
}

inspectAudio().catch(console.error);
