const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Read .env file
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1].trim() : null;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function seedSentences() {
  const jsonPath = path.join(__dirname, '../ewe_dataset_raw.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('ewe_dataset_raw.json not found at:', jsonPath);
    process.exit(1);
  }

  console.log('Loading ewe_dataset_raw.json into memory...');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const items = JSON.parse(rawData);
  const total = items.length;
  console.log(`Loaded ${total} sentences from dataset.`);

  const BATCH_SIZE = 500;
  let inserted = 0;
  const startTime = Date.now();

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    
    // Filter and sanitize text
    const cleanBatch = batch
      .map(item => {
        const text = (item.texte || item.text || '').trim();
        const source = (item.source || 'wikipedia').substring(0, 255);
        return { text, source };
      })
      .filter(item => item.text.length > 2 && item.text.length < 1000);

    if (cleanBatch.length === 0) continue;

    // Build multi-row parameter query
    // E.g. INSERT INTO sentences (text, source, language, recording_status) VALUES ($1, $2, 'ewe', 'pending'), ($3, $4, 'ewe', 'pending') ...
    const valuePlaceholders = [];
    const params = [];
    let pIdx = 1;

    for (const item of cleanBatch) {
      valuePlaceholders.push(`($${pIdx++}, $${pIdx++}, 'ewe', 'pending')`);
      params.push(item.text, item.source);
    }

    const query = `
      INSERT INTO sentences (text, source, language, recording_status)
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (text) DO NOTHING
    `;

    try {
      await sql.query(query, params);
      inserted += cleanBatch.length;
      
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const percent = ((inserted / total) * 100).toFixed(1);
      const rate = (inserted / (elapsedSec > 0 ? elapsedSec : 1)).toFixed(0);
      
      process.stdout.write(`\rProgress: ${inserted}/${total} (${percent}%) | Speed: ${rate} rows/s | Elapsed: ${elapsedSec}s`);
    } catch (err) {
      console.error(`\nError inserting batch starting at ${i}:`, err.message);
      // Wait slightly and retry single items if batch fails
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n✅ Finished seeding sentences! Total processed: ${inserted} in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

seedSentences().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
