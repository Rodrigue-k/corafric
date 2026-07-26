const { chromium } = require('playwright');
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

// Test list of highly frequent / important Ewe words
const targetWords = [
  "to", "ame", "vi", "ŋkeke", "nu", "dzi", "mɔ", "dze", "kpɔ", "wɔ",
  "dɔ", "nyi", "fofo", "dada", "devi", "xɔ", "zã", "ŋdi", "ŋdɔ", "fiẽ"
];

async function scrapeGlosbeWord(page, word) {
  const url = `https://glosbe.com/ee/fr/${encodeURIComponent(word)}`;
  console.log(`\nNavigating to ${url}`);
  
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    if (!response || !response.ok()) {
      console.log(`Failed to load page for ${word}. Status: ${response ? response.status() : 'Unknown'}`);
      return [];
    }

    // Wait a moment for dynamic content
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const results = [];
      
      // Select each translation block
      const items = document.querySelectorAll('.translation__item');
      
      items.forEach((item) => {
        // Find French Translation
        const frElem = item.querySelector('.translation__item__pharse');
        if (!frElem) return;
        const word_fr = frElem.innerText.trim();
        
        // Find Part of Speech
        let pos = null;
        const posElems = item.querySelectorAll('.text-xxs.text-gray-500 span');
        if (posElems.length > 0) {
          pos = Array.from(posElems).map(e => e.innerText.trim()).join(', ');
        }
        
        // Find Definition (if any)
        const defElem = item.querySelector('.def__text');
        const definition = defElem ? defElem.innerText.trim() : null;
        
        // Find Example Sentence for this specific meaning
        let example_ewe = null;
        let example_fr = null;
        const exampleBlock = item.querySelector('.translation__example');
        if (exampleBlock) {
          const eweElem = exampleBlock.querySelector('[lang="ee"]');
          const frExElem = exampleBlock.querySelector('[lang="fr"]');
          if (eweElem) example_ewe = eweElem.innerText.trim().replace(/\s+/g, ' ');
          if (frExElem) example_fr = frExElem.innerText.trim().replace(/\s+/g, ' ');
        }

        if (word_fr) {
          results.push({
            word_fr,
            part_of_speech: pos,
            definition,
            example_sentence_ewe: example_ewe,
            example_sentence_fr: example_fr,
            sources: ['glosbe']
          });
        }
      });
      
      return results;
    });
    
    console.log(`Found ${data.length} translations for "${word}"`);
    return data;
  } catch (err) {
    console.error(`Error scraping ${word}:`, err.message);
    return [];
  }
}

async function run() {
  console.log("Starting Glosbe Scraper...");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'fr-FR'
  });
  const page = await context.newPage();

  let insertedTotal = 0;

  for (const word of targetWords) {
    const translations = await scrapeGlosbeWord(page, word);
    
    for (const item of translations) {
      try {
        await sql`
          INSERT INTO dictionary_words (
            word_ewe, word_fr, part_of_speech, definition, 
            example_sentence_ewe, example_sentence_fr, sources, confidence_score
          ) VALUES (
            ${word}, ${item.word_fr}, ${item.part_of_speech}, ${item.definition},
            ${item.example_sentence_ewe}, ${item.example_sentence_fr}, 
            ${JSON.stringify(item.sources)}::jsonb, 5
          )
          ON CONFLICT (word_ewe, COALESCE(word_fr, '')) DO UPDATE SET
            part_of_speech = EXCLUDED.part_of_speech,
            example_sentence_ewe = EXCLUDED.example_sentence_ewe,
            example_sentence_fr = EXCLUDED.example_sentence_fr,
            confidence_score = 5
        `;
        insertedTotal++;
        console.log(` -> Inserted: ${word} = ${item.word_fr}`);
      } catch (dbErr) {
        console.error(`DB Insert Error for ${word} - ${item.word_fr}:`, dbErr.message);
      }
    }
  }

  console.log(`\nScraping complete! Inserted ${insertedTotal} distinct translation entries.`);
  await browser.close();
}

run();
