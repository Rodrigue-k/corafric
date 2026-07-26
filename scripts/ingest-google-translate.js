const { neon } = require('@neondatabase/serverless');
const { translate } = require('@vitalets/google-translate-api');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
  if (dbUrlMatch) {
    process.env.DATABASE_URL = dbUrlMatch[1].trim();
  }
}
// Extended English vocabulary list (150+ core words) to bootstrap the trilingual dictionary
const BOOTSTRAP_WORDS = [
  // Family & People
  "man", "woman", "child", "father", "mother", "brother", "sister", "son", "daughter", 
  "friend", "husband", "wife", "baby", "person", "people", "king", "chief",

  // Body Parts
  "head", "face", "eye", "ear", "nose", "mouth", "tooth", "tongue", "neck", "arm", 
  "hand", "finger", "leg", "foot", "heart", "blood", "stomach", "body",

  // Nature & Elements
  "water", "fire", "earth", "sky", "sun", "moon", "star", "rain", "wind", "cloud", 
  "river", "sea", "mountain", "forest", "tree", "leaf", "flower", "grass", "stone", "sand",

  // Animals
  "animal", "bird", "fish", "dog", "cat", "cow", "goat", "sheep", "chicken", "snake", 
  "elephant", "lion", "monkey", "horse",

  // Food & House
  "house", "door", "window", "room", "bed", "table", "chair", "food", "bread", "meat", 
  "salt", "yam", "corn", "oil", "clothing", "shoe", "money", "book", "car", "boat",

  // Places & Time
  "market", "road", "path", "village", "town", "country", "school", "hospital",
  "day", "night", "morning", "afternoon", "evening", "today", "tomorrow", "yesterday", "year", "month",

  // Colors & Numbers
  "white", "black", "red", "blue", "green", "yellow",
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "hundred", "thousand",

  // Actions & Verbs
  "eat", "drink", "sleep", "wake", "see", "hear", "speak", "listen", "walk", "run", 
  "come", "go", "sit", "stand", "give", "take", "buy", "sell", "work", "play", 
  "love", "help", "learn", "teach", "write", "read", "cook", "wash", "think", "know",

  // Adjectives & Qualities
  "good", "bad", "big", "small", "hot", "cold", "new", "old", "happy", "sad", 
  "fast", "slow", "strong", "weak", "clean", "dirty", "beautiful", "truth",

  // Everyday Phrases & Question Words
  "yes", "no", "hello", "thank you", "please", "goodbye", "who", "what", "where", "when", "why", "how"
];

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Please set it in .env");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log("Connected to database. Starting ingestion...");

  let successCount = 0;
  let errorCount = 0;

  for (const wordEn of BOOTSTRAP_WORDS) {
    console.log(`\nProcessing: "${wordEn}"...`);
    try {
      // 1. Translate English -> French (just to have the FR triplet)
      const resFr = await translate(wordEn, { from: 'en', to: 'fr' });
      const wordFr = resFr.text.toLowerCase();

      // 2. Translate English -> Ewe
      const resEwe = await translate(wordEn, { from: 'en', to: 'ee' });
      const wordEwe = resEwe.text.toLowerCase();

      console.log(`  -> EWE: ${wordEwe} | FR: ${wordFr} | EN: ${wordEn}`);
      
      // 3. Insert into database (audio_url is null until a native speaker records it)
      await sql`
        INSERT INTO dictionary_words (word_ewe, word_fr, word_en, audio_url, sources, confidence_score)
        VALUES (
          ${wordEwe}, 
          ${wordFr}, 
          ${wordEn}, 
          NULL, 
          '["google-translate"]'::jsonb, 
          1
        )
        ON CONFLICT (word_ewe) DO UPDATE SET 
          word_fr = EXCLUDED.word_fr,
          word_en = EXCLUDED.word_en,
          sources = (
            SELECT jsonb_agg(DISTINCT x) 
            FROM jsonb_array_elements(dictionary_words.sources || '["google-translate"]'::jsonb) x
          ),
          confidence_score = dictionary_words.confidence_score + 1
      `;
      console.log(`  [+] Inserted/Updated "${wordEwe}" successfully.`);
      successCount++;

      // Wait 1 second to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  [!] Error processing "${wordEn}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\nIngestion complete! Successfully added: ${successCount}. Errors: ${errorCount}.`);
}

run();
