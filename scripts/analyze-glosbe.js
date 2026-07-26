const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeGlosbe(word) {
  try {
    console.log(`Fetching Glosbe page for: ${word}`);
    const url = `https://glosbe.com/ee/fr/${encodeURIComponent(word)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    console.log("--- Glosbe Data Analysis ---");
    
    // Look for translations
    const translations = [];
    $('.translation__item__text').each((i, el) => {
      translations.push($(el).text().trim());
    });
    console.log("Translations found:", translations.length > 0 ? translations : "None");

    // Look for phonetics / IPA
    const phonetics = [];
    $('.phrase__phonetics').each((i, el) => {
      phonetics.push($(el).text().trim());
    });
    console.log("Phonetics/Tones found:", phonetics.length > 0 ? phonetics : "None");

    // Look for audio
    const audios = [];
    $('audio source, .audio-player, [data-audio-url]').each((i, el) => {
      audios.push($(el).attr('src') || $(el).attr('data-audio-url'));
    });
    console.log("Audios found:", audios.length > 0 ? audios : "None");

    // Look for definitions / descriptions
    const definitions = [];
    $('.def__text').each((i, el) => {
      definitions.push($(el).text().trim());
    });
    console.log("Definitions found:", definitions.length > 0 ? definitions : "None");

    // Look for example sentences
    const examples = [];
    $('.tmem__item').each((i, el) => {
      const ewe = $(el).find('.tmem__item__source').text().trim().replace(/\s+/g, ' ');
      const fr = $(el).find('.tmem__item__target').text().trim().replace(/\s+/g, ' ');
      if (ewe && fr) examples.push({ ewe, fr });
    });
    console.log(`Example sentences found: ${examples.length}`);
    if (examples.length > 0) {
      console.log("First example:");
      console.log(` Ewe: ${examples[0].ewe}`);
      console.log(` FR:  ${examples[0].fr}`);
    }

    console.log("\n--- Raw HTML snippets for manual review ---");
    console.log("Phrase summary box:", $('.phrase-summary').html()?.slice(0, 300));
    
  } catch (error) {
    console.error("Error fetching Glosbe:", error.message);
  }
}

analyzeGlosbe('to');
analyzeGlosbe('deví');
