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

async function audit() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("================ DATABASE SCHEMA AUDIT ================");

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  for (const t of tables) {
    const tableName = t.table_name;
    const countRes = await sql.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
    console.log(`\n📁 TABLE: ${tableName} (${countRes[0].cnt} rows)`);

    const cols = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY ordinal_position;
    `;

    cols.forEach(c => {
      console.log(`   - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
    });
  }
}

audit().catch(console.error);
