const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

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

async function cleanDatabase() {
  console.log('--- Cleaning database recordings and resetting contributions ---');
  try {
    console.log('1. Deleting all validations...');
    await sql`DELETE FROM validations`;
    
    console.log('2. Deleting all recordings...');
    await sql`DELETE FROM recordings`;
    
    console.log('3. Resetting sentence recording status...');
    await sql`UPDATE sentences SET recording_status = 'pending'`;
    
    console.log('4. Resetting user contribution counters...');
    await sql`UPDATE users SET total_contributions = 0, total_validations = 0`;
    
    console.log('✅ Database successfully cleaned! All bad recordings removed, ready for clean launch.');
  } catch (err) {
    console.error('Error cleaning database:', err);
  }
}

cleanDatabase();
