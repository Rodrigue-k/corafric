const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Load .env variables
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const parseEnv = (key) => {
  const m = envContent.match(new RegExp(`${key}=(.*)`));
  return m ? m[1].trim() : null;
};

const databaseUrl = parseEnv('DATABASE_URL');
const accountId = parseEnv('R2_ACCOUNT_ID');
const accessKeyId = parseEnv('R2_ACCESS_KEY_ID');
const secretAccessKey = parseEnv('R2_SECRET_ACCESS_KEY');
const bucketName = parseEnv('R2_BUCKET_NAME') || 'corafric-audio';

if (!databaseUrl || !accountId || !accessKeyId || !secretAccessKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const sql = neon(databaseUrl);
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ɔ/g, 'o')
    .replace(/ɛ/g, 'e')
    .replace(/ɖ/g, 'd')
    .replace(/ƒ/g, 'f')
    .replace(/ɣ/g, 'gh')
    .replace(/ŋ/g, 'ng')
    .replace(/ʋ/g, 'v')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function run() {
  console.log('Fetching recordings to migrate...');
  
  const res = await sql.query(`
    SELECT r.id, r.audio_url, w.word_ewe 
    FROM recordings r
    JOIN dictionary_words w ON r.word_id = w.id
  `);
  const rows = res.rows || res;

  for (const row of rows) {
    const oldUrl = row.audio_url;
    // Extract key from URL
    // e.g. https://.../recordings/ewe/2026-07-26/5f09276f-d3ae-4724-af5d-cf2c77aa3471.webm
    const match = oldUrl.match(/(recordings\/ewe\/[^\/]+\/)([^\/]+)$/);
    if (!match) continue;

    const folder = match[1]; // recordings/ewe/2026-07-26/
    const filename = match[2]; // 5f09276f-d3ae-4724-af5d-cf2c77aa3471.webm

    // Extract UUID suffix (last 8 hex chars or full UUID)
    const uuidMatch = filename.match(/([a-f0-9]{8})(?:\.webm)?$/i);
    const shortId = uuidMatch ? uuidMatch[1] : filename.substring(0, 8);

    const wordSlug = slugify(row.word_ewe || 'word');
    const newFilename = `${wordSlug}_${shortId}.webm`;

    if (filename === newFilename && oldUrl.startsWith('/api/audio/')) {
      console.log(`Skipping already properly named and routed file: ${filename}`);
      continue;
    }

    // Always update database URL to /api/audio proxy route
    const newUrl = `/api/audio/${folder}${newFilename}`;
    await sql.query(
      `UPDATE recordings SET audio_url = $1 WHERE id = $2`,
      [newUrl, row.id]
    );

    if (filename === newFilename) {
      console.log(`Updated DB URL for ${row.id} -> ${newUrl}`);
      continue;
    }
    const oldKey = `${folder}${filename}`;
    const newKey = `${folder}${newFilename}`;

    console.log(`Renaming ${oldKey} -> ${newKey}...`);

    try {
      // 1. Copy object to new key
      await r2Client.send(
        new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${oldKey}`,
          Key: newKey,
        })
      );

      // 2. Delete old object
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: oldKey,
        })
      );

      // 3. Update database URL to /api/audio proxy route
      const newUrl = `/api/audio/${newKey}`;
      await sql.query(
        `UPDATE recordings SET audio_url = $1 WHERE id = $2`,
        [newUrl, row.id]
      );

      console.log(`Successfully updated ${row.id} -> ${newUrl}`);
    } catch (err) {
      console.error(`Error renaming ${oldKey}:`, err.message);
    }
  }

  console.log('Migration completed!');
}

run();
