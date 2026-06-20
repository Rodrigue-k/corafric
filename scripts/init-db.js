const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Read .env file manually
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

const sqlContent = fs.readFileSync(path.join(__dirname, '../src/lib/schema.sql'), 'utf8');

const sql = neon(databaseUrl);

async function run() {
  console.log('Initializing database on Neon...');
  try {
    // Basic SQL splitter (removes comments and splits by semicolon)
    const queries = sqlContent
      .split('\n')
      .map(line => line.replace(/--.*$/, '').trim()) // remove comments
      .join(' ')
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (const query of queries) {
      console.log(`Executing: ${query.substring(0, 50)}...`);
      await sql.query(query);
    }
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

run();
