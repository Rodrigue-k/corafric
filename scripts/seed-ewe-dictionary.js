const { neon } = require('@neondatabase/serverless');
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

// Curated offline Ewe - French - English dictionary dataset (High quality & instant seed)
const EWE_DICTIONARY_DATASET = [
  // Greetings & Essentials
  { ewe: "ŋdi na wò", fr: "bonjour (matin)", en: "good morning" },
  { ewe: "ŋdɔ na wò", fr: "bonjour (après-midi)", en: "good afternoon" },
  { ewe: "fiẽ na wò", fr: "bonsoir", en: "good evening" },
  { ewe: "za na wò", fr: "bonne nuit", en: "good night" },
  { ewe: "akpe na wò", fr: "merci", en: "thank you" },
  { ewe: "akpe kaka", fr: "merci beaucoup", en: "thank you very much" },
  { ewe: "taflatse", fr: "s'il te plaît / pardon", en: "please / excuse me" },
  { ewe: "ɛ̃", fr: "oui", en: "yes" },
  { ewe: "ao", fr: "non", en: "no" },
  { ewe: "efoa?", fr: "comment vas-tu ?", en: "how are you?" },
  { ewe: "mefo", fr: "je vais bien", en: "I am fine" },
  { ewe: "mia dogo", fr: "au revoir", en: "goodbye" },

  // Family & People
  { ewe: "ŋutsu", fr: "homme", en: "man" },
  { ewe: "nyɔnu", fr: "femme", en: "woman" },
  { ewe: "ɖevi", fr: "enfant", en: "child" },
  { ewe: "tɔ", fr: "père", en: "father" },
  { ewe: "nɔ", fr: "mère", en: "mother" },
  { ewe: "noviŋutsu", fr: "frère", en: "brother" },
  { ewe: "novinyɔnu", fr: "sœur", en: "sister" },
  { ewe: "vinyɔnu", fr: "fille", en: "daughter" },
  { ewe: "viŋutsu", fr: "fils", en: "son" },
  { ewe: "xɔ̃", fr: "ami", en: "friend" },
  { ewe: "srɔ̃ŋutsu", fr: "mari", en: "husband" },
  { ewe: "srɔ̃nyɔnu", fr: "épouse", en: "wife" },
  { ewe: "tɔgbui", fr: "grand-père", en: "grandfather" },
  { ewe: "mama", fr: "grand-mère", en: "grandmother" },

  // Body Parts
  { ewe: "ta", fr: "tête", en: "head" },
  { ewe: "mo", fr: "visage", en: "face" },
  { ewe: "ŋku", fr: "œil", en: "eye" },
  { ewe: "to", fr: "oreille", en: "ear" },
  { ewe: "ŋɔti", fr: "nez", en: "nose" },
  { ewe: "nu", fr: "bouche", en: "mouth" },
  { ewe: "aɖe", fr: "langue", en: "tongue" },
  { ewe: "aɖu", fr: "dent", en: "tooth" },
  { ewe: "asi", fr: "main", en: "hand" },
  { ewe: "afɔ", fr: "pied", en: "foot" },
  { ewe: "dɔme", fr: "ventre", en: "stomach" },
  { ewe: "dzi", fr: "cœur", en: "heart" },

  // Nature & Environment
  { ewe: "tsi", fr: "eau", en: "water" },
  { ewe: "dzo", fr: "feu", en: "fire" },
  { ewe: "anyigba", fr: "terre", en: "earth / land" },
  { ewe: "dzifo", fr: "ciel", en: "sky" },
  { ewe: "ɣe", fr: "soleil", en: "sun" },
  { ewe: "dzinu", fr: "lune", en: "moon" },
  { ewe: "ɣletivi", fr: "étoile", en: "star" },
  { ewe: "tsi dzadza", fr: "pluie", en: "rain" },
  { ewe: "ya", fr: "vent / air", en: "wind / air" },
  { ewe: "tɔsisi", fr: "rivière", en: "river" },
  { ewe: "amu", fr: "fleuve", en: "ocean / river" },
  { ewe: "ati", fr: "arbre", en: "tree" },
  { ewe: "aŋgba", fr: "feuille", en: "leaf" },
  { ewe: "kpe", fr: "pierre", en: "stone" },
  { ewe: "ke", fr: "sable", en: "sand" },

  // Animals
  { ewe: "lã", fr: "animal / viande", en: "animal / meat" },
  { ewe: "avu", fr: "chien", en: "dog" },
  { ewe: "dadi", fr: "chat", en: "cat" },
  { ewe: "gbo", fr: "chèvre", en: "goat" },
  { ewe: "alẽ", fr: "mouton", en: "sheep" },
  { ewe: "koklo", fr: "poule / poulet", en: "chicken" },
  { ewe: "xe", fr: "oiseau", en: "bird" },
  { ewe: "tɔmelã", fr: "poisson", en: "fish" },
  { ewe: "da", fr: "serpent", en: "snake" },
  { ewe: "atiglinyi", fr: "éléphant", en: "elephant" },

  // Food & House
  { ewe: "nuɖuɖu", fr: "nourriture", en: "food" },
  { ewe: "abolo", fr: "pain", en: "bread" },
  { ewe: "dze", fr: "sel", en: "salt" },
  { ewe: "ami", fr: "huile", en: "oil" },
  { ewe: "te", fr: "igname", en: "yam" },
  { ewe: "bli", fr: "maïs", en: "corn" },
  { ewe: "aƒe", fr: "maison / foyer", en: "house / home" },
  { ewe: "ʋɔtru", fr: "porte", en: "door" },
  { ewe: "fesre", fr: "fenêtre", en: "window" },
  { ewe: "xɔ", fr: "chambre / pièce", en: "room / house" },
  { ewe: "kplɔ̃", fr: "table", en: "table" },
  { ewe: "zikpui", fr: "chaise", en: "chair" },
  { ewe: "aba", fr: "lit", en: "bed" },

  // Numbers & Math
  { ewe: "ɖeka", fr: "un", en: "one" },
  { ewe: "eve", fr: "deux", en: "two" },
  { ewe: "etɔ̃", fr: "trois", en: "three" },
  { ewe: "ene", fr: "quatre", en: "four" },
  { ewe: "atɔ̃", fr: "cinq", en: "five" },
  { ewe: "ade", fr: "six", en: "six" },
  { ewe: "adre", fr: "sept", en: "seven" },
  { ewe: "enyĩ", fr: "huit", en: "eight" },
  { ewe: "asieke", fr: "neuf", en: "nine" },
  { ewe: "ewo", fr: "dix", en: "ten" },
  { ewe: "alafa", fr: "cent", en: "hundred" },
  { ewe: "akpe", fr: "mille", en: "thousand" },

  // Verbs & Actions
  { ewe: "ɖu", fr: "manger", en: "eat" },
  { ewe: "no", fr: "boire", en: "drink" },
  { ewe: "dɔ alɔ̃", fr: "dormir", en: "sleep" },
  { ewe: "nyɔ", fr: "réveiller", en: "wake up" },
  { ewe: "kpɔ", fr: "voir / regarder", en: "see / watch" },
  { ewe: "se", fr: "entendre / écouter", en: "hear / listen" },
  { ewe: "gblɔ", fr: "dire / parler", en: "say / speak" },
  { ewe: "zɔ̃", fr: "marcher", en: "walk" },
  { ewe: "ƒu du", fr: "courir", en: "run" },
  { ewe: "va", fr: "venir", en: "come" },
  { ewe: "yi", fr: "aller", en: "go" },
  { ewe: "bɔbɔ nɔ anyi", fr: "s'asseoir", en: "sit down" },
  { ewe: "tsi tre", fr: "se lever / se tenir debout", en: "stand up" },
  { ewe: "na", fr: "donner", en: "give" },
  { ewe: "xɔ", fr: "recevoir / prendre", en: "receive / take" },
  { ewe: "fle", fr: "acheter", en: "buy" },
  { ewe: "dzra", fr: "vendre", en: "sell" },
  { ewe: "wɔ dɔ", fr: "travailler", en: "work" },
  { ewe: "lɔ̃", fr: "aimer", en: "love" },
  { ewe: "kpe ɖe eŋu", fr: "aider", en: "help" },

  // Colors
  { ewe: "ɣi", fr: "blanc", en: "white" },
  { ewe: "yibɔ", fr: "noir", en: "black" },
  { ewe: "dzẽ", fr: "rouge", en: "red" },
  { ewe: "gbãmã", fr: "vert", en: "green" },

  // Adjectives
  { ewe: "enyo", fr: "bon / bien", en: "good" },
  { ewe: "vɔ̃", fr: "mauvais / mal", en: "bad" },
  { ewe: "gã", fr: "grand", en: "big / large" },
  { ewe: "sue", fr: "petit", en: "small" },
  { ewe: "xɔ dzo", fr: "chaud", en: "hot" },
  { ewe: "fa", fr: "froid", en: "cold" },
  { ewe: "yeye", fr: "nouveau", en: "new" },
  { ewe: "xoxo", fr: "ancien / vieux", en: "old" },
  { ewe: "kpla", fr: "fort / puissant", en: "strong" }
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log("Connected to Neon DB. Starting offline seed of curated Ewe dictionary dataset...");

  let inserted = 0;
  for (const item of EWE_DICTIONARY_DATASET) {
    try {
      await sql`
        INSERT INTO dictionary_words (word_ewe, word_fr, word_en, audio_url, sources, confidence_score)
        VALUES (
          ${item.ewe.toLowerCase()}, 
          ${item.fr.toLowerCase()}, 
          ${item.en.toLowerCase()}, 
          NULL, 
          '["lexique-curated", "open-ewe-dataset"]'::jsonb, 
          2
        )
        ON CONFLICT (word_ewe) DO UPDATE SET 
          word_fr = EXCLUDED.word_fr,
          word_en = EXCLUDED.word_en,
          sources = (
            SELECT jsonb_agg(DISTINCT x) 
            FROM jsonb_array_elements(dictionary_words.sources || '["lexique-curated", "open-ewe-dataset"]'::jsonb) x
          ),
          confidence_score = dictionary_words.confidence_score + 1
      `;
      inserted++;
      console.log(`[+] Seeded: ${item.ewe} -> FR: ${item.fr} | EN: ${item.en}`);
    } catch (err) {
      console.error(`[!] Error seeding "${item.ewe}":`, err.message);
    }
  }

  console.log(`\nOffline seeding complete! Inserted/Updated: ${inserted} entries.`);
}

seed();
