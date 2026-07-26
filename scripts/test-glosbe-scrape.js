const https = require('https');

function fetchGlosbe(word) {
  const url = `https://glosbe.com/ee/fr/${encodeURIComponent(word)}`;
  console.log(`Fetching ${url}...`);
  
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log(`Received ${data.length} bytes`);
        // Simple regex to see if we can find translations
        const translations = data.match(/class="translation__item__text"[^>]*>([^<]+)<\/span>/g);
        if (translations) {
          console.log("Found translations:");
          translations.slice(0, 5).forEach(t => {
            const clean = t.replace(/<[^>]+>/g, '').trim();
            console.log(" -", clean);
          });
        } else {
          console.log("No translations found with regex.");
        }
      }
    });
  }).on('error', err => console.error(err));
}

fetchGlosbe('to');
