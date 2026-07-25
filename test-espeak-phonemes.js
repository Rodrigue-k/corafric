const text2wav = require('text2wav');
const fs = require('fs');

async function testPhonemes() {
  const phonemes = {
    "a": "A:",
    "b": "b",
    "d": "d",
    "ɖ": "d",
    "e": "e",
    "ɛ": "e",
    "f": "f",
    "ƒ": "f",
    "g": "g",
    "ɣ": "g",
    "h": "h",
    "x": "h",
    "i": "i:",
    "k": "k",
    "l": "l",
    "m": "m",
    "n": "n",
    "ŋ": "N",
    "o": "O:",
    "ɔ": "O:",
    "p": "p",
    "r": "r",
    "s": "s",
    "t": "t",
    "u": "u:",
    "v": "v",
    "ʋ": "v",
    "w": "w",
    "y": "j",
    "z": "z"
  };

  for (const [char, espeakCode] of Object.entries(phonemes)) {
    try {
      const out = await text2wav(`[[${espeakCode}]]`, { voice: 'en' });
      if (out.length < 50) {
        console.log(`Silence generated for ${char} (${espeakCode})`);
      } else {
        console.log(`Success for ${char} (${espeakCode}), size: ${out.length}`);
      }
    } catch (e) {
      console.log(`Error for ${char} (${espeakCode}):`, e.message);
    }
  }
}

testPhonemes();
