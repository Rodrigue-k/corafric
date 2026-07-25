const text2wav = require('text2wav');
const fs = require('fs');

async function test() {
  try {
    console.log('Testing raw IPA phonemes using base voice en...');
    // Ewe word with special IPA characters
    let out = await text2wav('[[d\u0256]]', { voice: 'en' }); // ɖ is \u0256
    fs.writeFileSync('test_ipa.wav', out);
    console.log('Success with IPA phonemes!');
  } catch (e) {
    console.log('IPA phonemes failed:', e.message);
  }
}

test();
