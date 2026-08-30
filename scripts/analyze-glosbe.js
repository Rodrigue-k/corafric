const axios = require('axios');
const cheerio = require('cheerio');
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

const sql = neon(process.env.DATABASE_URL);

async function scrapeGlosbeFast(word) {
  try {
    const url = `https://glosbe.com/ee/fr/${encodeURIComponent(word)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
      },
      timeout: 8000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const translations = [];
    $('.translation__item__phrase, .translation__item__text').each((i, el) => {
      const text = $(el).text().trim();
      if (text && !translations.includes(text) && text.length < 100) {
        translations.push(text);
      }
    });

    let definition = null;
    $('.def__text').first().each((i, el) => {
      definition = $(el).text().trim();
    });

    let exampleEwe = null;
    let exampleFr = null;
    $('.tmem__item').first().each((i, el) => {
      const ewe = $(el).find('.tmem__item__source').text().trim().replace(/\s+/g, ' ');
      const fr = $(el).find('.tmem__item__target').text().trim().replace(/\s+/g, ' ');
      if (ewe && fr) {
        exampleEwe = ewe;
        exampleFr = fr;
      }
    });

    if (translations.length > 0) {
      return {
        word_fr: translations[0],
        secondary_translations: translations.slice(1, 4),
        definition: definition || null,
        example_sentence_ewe: exampleEwe,
        example_sentence_fr: exampleFr
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function enrichFromCorpus() {
  console.log("=== Corafric Dictionary Enrichment Pipeline ===");
  console.log("1. Extracting high-frequency vocabulary from 174k sentences...");

  const rows = await sql`SELECT text FROM sentences WHERE text IS NOT NULL LIMIT 50000`;
  console.log(`Analyzing vocabulary across ${rows.length} sample sentences...`);

  const freqMap = new Map();
  const ewePatt = /[a-zɖɛƒɣŋɔʋ]/i;

  for (const row of rows) {
    if (!row.text) continue;
    const clean = row.text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»“”0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = clean.split(' ');
    for (let w of words) {
      w = w.trim();
      if (w.length >= 2 && w.length <= 25 && ewePatt.test(w)) {
        freqMap.set(w, (freqMap.get(w) || 0) + 1);
      }
    }
  }

  console.log(`Found ${freqMap.size} unique candidate vocabulary words.`);
  
  // Sort by frequency (most common natural Éwé words)
  const sorted = Array.from(freqMap.entries())
    .filter(([_, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1]);

  console.log(`Filtered to ${sorted.length} high-frequency natural words (frequency >= 5).`);
  
  // Check which words already have translations in dictionary_words
  const existingWords = await sql`SELECT word_ewe FROM dictionary_words WHERE word_fr IS NOT NULL`;
  const existingSet = new Set(existingWords.map(r => r.word_ewe.toLowerCase()));

  const wordsToScrape = sorted
    .filter(([w]) => !existingSet.has(w))
    .slice(0, 300); // Process batch of 300 words

  console.log(`Starting Glosbe scraping for ${wordsToScrape.length} new words...`);

  let added = 0;
  for (let i = 0; i < wordsToScrape.length; i++) {
    const [word, freq] = wordsToScrape[i];
    const data = await scrapeGlosbeFast(word);

    if (data && data.word_fr) {
      try {
        await sql`
          INSERT INTO dictionary_words (
            word_ewe, word_fr, definition, example_sentence_ewe, example_sentence_fr, sources, confidence_score
          ) VALUES (
            ${word}, ${data.word_fr}, ${data.definition}, 
            ${data.example_sentence_ewe}, ${data.example_sentence_fr},
            '["glosbe", "community-corpus"]'::jsonb, 4
          )
          ON CONFLICT (word_ewe) DO UPDATE SET
            word_fr = EXCLUDED.word_fr,
            definition = COALESCE(dictionary_words.definition, EXCLUDED.definition),
            example_sentence_ewe = COALESCE(dictionary_words.example_sentence_ewe, EXCLUDED.example_sentence_ewe),
            example_sentence_fr = COALESCE(dictionary_words.example_sentence_fr, EXCLUDED.example_sentence_fr),
            confidence_score = 4
        `;
        added++;
        console.log(`[${i + 1}/${wordsToScrape.length}] (+) Added: "${word}" -> FR: "${data.word_fr}"`);
      } catch (dbErr) {
        // Continue
      }
    } else {
      process.stdout.write(`.`);
    }

    // Small delay to be polite to Glosbe servers
    await new Promise(r => setTimeout(r, 200));
  }

  const finalCount = await sql`SELECT COUNT(*) FROM dictionary_words WHERE word_fr IS NOT NULL`;
  console.log(`\n✅ Dictionary enrichment complete! Added ${added} verified terms.`);
  console.log(`Total words with translations in dictionary: ${finalCount[0].count}`);
}

enrichFromCorpus().catch(console.error);
