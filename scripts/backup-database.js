const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Load .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ Erreur: DATABASE_URL n'est pas définie dans .env");
  process.exit(1);
}

function getPostgresOptions(urlStr) {
  try {
    const regex = /^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/;
    const match = urlStr.match(regex);
    if (match) {
      const [, user, rawPassword, host, portStr, database] = match;
      return {
        host,
        port: portStr ? parseInt(portStr, 10) : 5432,
        user: decodeURIComponent(user),
        password: decodeURIComponent(rawPassword),
        database: decodeURIComponent(database),
        max: 5,
        connect_timeout: 10,
      };
    }
  } catch (err) {
    console.warn("URL parsing fallback:", err.message);
  }
  return urlStr;
}

async function backupDatabase() {
  const sql = postgres(getPostgresOptions(databaseUrl));
  console.log("📦 Démarrage de la sauvegarde de la base de données Corafric...");

  try {
    const tables = [
      'dictionary_words',
      'sentences',
      'recordings',
      'validations',
      'users',
      'translation_suggestions',
      'phonemes'
    ];

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      counts: {},
      data: {}
    };

    for (const table of tables) {
      try {
        const rows = await sql`SELECT * FROM ${sql(table)}`;
        backupData.data[table] = rows;
        backupData.counts[table] = rows.length;
        console.log(`  ✓ Table '${table}': ${rows.length} enregistrements extraits.`);
      } catch (tableErr) {
        console.warn(`  ⚠️ Table '${table}' ignorée (${tableErr.message})`);
        backupData.counts[table] = 0;
        backupData.data[table] = [];
      }
    }

    const backupsDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `corafric_backup_${dateStr}.json`;
    const filePath = path.join(backupsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

    const stats = fs.statSync(filePath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n🎉 Sauvegarde terminée avec succès !`);
    console.log(`📁 Fichier : backups/${fileName}`);
    console.log(`📊 Taille  : ${sizeMb} Mo (${stats.size} octets)`);
  } catch (error) {
    console.error("❌ Erreur pendant la sauvegarde:", error);
  } finally {
    await sql.end();
  }
}

backupDatabase();
