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

async function extractAndSeedWords() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log("Connected to DB. Fetching sentences from database...");

  // 1. Fetch all sentences
  const rows = await sql.query('SELECT text FROM sentences WHERE text IS NOT NULL');
  console.log(`Fetched ${rows.length} sentences. Processing vocabulary extraction...`);

  // 2. Tokenize & count word frequencies
  const wordFrequencyMap = new Map();

  for (const row of rows) {
    if (!row.text) continue;
    // Clean text: strip punctuation except Ewe special characters (e.g. ŋ, ɖ, ƒ, ɔ, ɛ, ɣ, ʋ, ', -)
    const cleanedText = row.text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = cleanedText.split(' ');
    for (let token of tokens) {
      token = token.trim();
      // Only keep tokens with length >= 2 and contains non-digits
      if (token.length >= 2 && !/^\d+$/.test(token)) {
        wordFrequencyMap.set(token, (wordFrequencyMap.get(token) || 0) + 1);
      }
    }
  }

  console.log(`Extracted ${wordFrequencyMap.size} unique Éwé words from the sentence corpus.`);

  // Sort words by frequency (most frequent first)
  const sortedWords = Array.from(wordFrequencyMap.entries())
    .sort((a, b) => b[1] - a[1]);

  console.log(`Top 10 most frequent words:`, sortedWords.slice(0, 10));

  // Batch insert into dictionary_words
  console.log("Starting DB batch insertion...");
  let insertedCount = 0;
  let batchSize = 100;

  for (let i = 0; i < sortedWords.length; i += batchSize) {
    const chunk = sortedWords.slice(i, i + batchSize);
    
    // Process chunk in parallel promises
    await Promise.all(
      chunk.map(async ([word, freq]) => {
        try {
          await sql`
            INSERT INTO dictionary_words (word_ewe, word_fr, word_en, audio_url, sources, confidence_score)
            VALUES (
              ${word}, 
              NULL, 
              NULL, 
              NULL, 
              '["bible-corpus"]'::jsonb, 
              1
            )
            ON CONFLICT (word_ewe) DO UPDATE SET 
              sources = (
                SELECT jsonb_agg(DISTINCT x) 
                FROM jsonb_array_elements(dictionary_words.sources || '["bible-corpus"]'::jsonb) x
              )
          `;
          insertedCount++;
        } catch (err) {
          // Ignore individual duplicate / syntax conflicts
        }
      })
    );

    if ((i + batchSize) % 1000 === 0 || i + batchSize >= sortedWords.length) {
      console.log(`Progress: ${Math.min(i + batchSize, sortedWords.length)} / ${sortedWords.length} words processed.`);
    }
  }

  console.log(`\nCorpus vocabulary extraction & insertion complete! Total unique words: ${sortedWords.length}`);
}

extractAndSeedWords();
