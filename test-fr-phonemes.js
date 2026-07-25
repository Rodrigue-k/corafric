const text2wav = require('text2wav');
const fs = require('fs');

async function testFR() {
  const phonemes = {
    "a": "a",
    "b": "b",
    "d": "d",
    "ɖ": "d", // fallback
    "e": "e", // closed e
    "ɛ": "E", // open e
    "f": "f",
    "ƒ": "f",
    "g": "g",
    "ɣ": "R", // French R is a velar/uvular fricative, very close to Ewe ɣ!
    "h": "h",
    "x": "h",
    "i": "i",
    "k": "k",
    "l": "l",
    "m": "m",
    "n": "n",
    "ŋ": "N",
    "o": "o", // closed o
    "ɔ": "O", // open o
    "p": "p",
    "r": "r", // rolled r (maybe R?)
    "s": "s",
    "t": "t",
    "u": "u",
    "v": "v",
    "ʋ": "v",
    "w": "w",
    "y": "j",
    "z": "z"
  };

  for (const [char, espeakCode] of Object.entries(phonemes)) {
    try {
      const out = await text2wav(`[[${espeakCode}]]`, { voice: 'fr' });
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

testFR();
