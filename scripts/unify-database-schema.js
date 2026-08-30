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

async function unifySchemaFast() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("=== Fast Atomic Database Unification & Cleanup ===");

  // 1. Direct SQL Set-based insertion from words & word_examples into dictionary_words
  console.log("1. Merging legacy 'words' and 'word_examples' directly into 'dictionary_words'...");
  await sql`
    INSERT INTO dictionary_words (
      word_ewe, 
      word_fr, 
      word_en, 
      part_of_speech, 
      example_sentence_ewe, 
      example_sentence_fr, 
      sources, 
      confidence_score
    )
    SELECT 
      LOWER(TRIM(w.word_ewe)) as word_ewe,
      TRIM(w.definition_fr) as word_fr,
      TRIM(w.definition_en) as word_en,
      TRIM(w.part_of_speech) as part_of_speech,
      TRIM(e.example_ewe) as example_sentence_ewe,
      TRIM(e.translation_fr) as example_sentence_fr,
      '["legacy-vocabulary-lexicon"]'::jsonb as sources,
      4 as confidence_score
    FROM words w
    LEFT JOIN word_examples e ON e.word_id = w.id
    WHERE w.word_ewe IS NOT NULL AND TRIM(w.word_ewe) != ''
    ON CONFLICT (word_ewe, COALESCE(word_fr, '')) DO UPDATE SET
      word_en = COALESCE(dictionary_words.word_en, EXCLUDED.word_en),
      part_of_speech = COALESCE(dictionary_words.part_of_speech, EXCLUDED.part_of_speech),
      example_sentence_ewe = COALESCE(dictionary_words.example_sentence_ewe, EXCLUDED.example_sentence_ewe),
      example_sentence_fr = COALESCE(dictionary_words.example_sentence_fr, EXCLUDED.example_sentence_fr);
  `;
  console.log("✅ Merged all vocabulary into 'dictionary_words'.");

  // 2. Drop legacy tables
  console.log("2. Dropping redundant legacy tables ('words', 'word_examples')...");
  await sql`DROP TABLE IF EXISTS word_examples CASCADE;`;
  await sql`DROP TABLE IF EXISTS words CASCADE;`;
  console.log("✅ Obsolete tables dropped.");

  // 3. Final counts
  const totalWords = await sql`SELECT COUNT(*) FROM dictionary_words;`;
  const totalSentences = await sql`SELECT COUNT(*) FROM sentences;`;
  const totalUsers = await sql`SELECT COUNT(*) FROM users;`;
  const totalRecordings = await sql`SELECT COUNT(*) FROM recordings;`;
  const totalValidations = await sql`SELECT COUNT(*) FROM validations;`;
  const totalSuggestions = await sql`SELECT COUNT(*) FROM translation_suggestions;`;
  const totalPhonemes = await sql`SELECT COUNT(*) FROM phonemes;`;

  console.log("\n================ CLEAN UNIFIED DATABASE SCHEMA ================");
  console.log(`1. dictionary_words       : ${totalWords[0].count} terms (Complete Trilingual Dictionary & TTS Lexicon)`);
  console.log(`2. sentences              : ${totalSentences[0].count} phrases (Complete Speech Corpus for AI Training)`);
  console.log(`3. recordings             : ${totalRecordings[0].count} rows (Voice Audios for Words & Sentences)`);
  console.log(`4. validations            : ${totalValidations[0].count} rows (Peer-Review Validation Votes)`);
  console.log(`5. translation_suggestions: ${totalSuggestions[0].count} rows (Community Corrections & Translations)`);
  console.log(`6. users                  : ${totalUsers[0].count} contributors (User Profiles & Statistics)`);
  console.log(`7. phonemes               : ${totalPhonemes[0].count} phonetic rules (TTS Engine Conversion Matrix)`);
  console.log("===============================================================");
}

unifySchemaFast().catch(console.error);
