const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
  if (dbUrlMatch) {
    process.env.DATABASE_URL = dbUrlMatch[1].trim();
  }
}

async function linkExamples() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log("Connected to DB. Finding example sentences for dictionary words...");

  // Get words that have translations
  const words = await sql.query('SELECT id, word_ewe FROM dictionary_words WHERE example_sentence_ewe IS NULL LIMIT 500');
  console.log(`Found ${words.length} words to find example sentences for...`);

  let updatedCount = 0;
  for (const wordRow of words) {
    const word = wordRow.word_ewe;
    if (!word || word.length < 2) continue;

    // Search for a sentence containing this word as a whole word
    const searchTerm = `% ${word.toLowerCase()} %`;
    const sentences = await sql`
      SELECT text FROM sentences 
      WHERE LOWER(text) LIKE ${searchTerm} OR LOWER(text) LIKE ${word.toLowerCase() + ' %'}
      LIMIT 1
    `;

    if (sentences.length > 0) {
      const sentenceText = sentences[0].text;
      await sql`
        UPDATE dictionary_words 
        SET example_sentence_ewe = ${sentenceText}
        WHERE id = ${wordRow.id}
      `;
      updatedCount++;
    }
  }

  console.log(`Linked example sentences for ${updatedCount} words!`);
}

linkExamples();
