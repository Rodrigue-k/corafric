const text2wav = require('text2wav');
const fs = require('fs');

async function test() {
  try {
    console.log('Testing raw phonemes using base voice...');
    // In espeak, phonemes are enclosed in [[ ]]
    let out2 = await text2wav('[[a]]', { voice: 'fr' });
    fs.writeFileSync('test_phonemes.wav', out2);
    console.log('Success with raw phonemes!');
  } catch (e2) {
    console.log('Raw phonemes failed:', e2.message);
  }
}

test();
