import { sql } from "@/lib/db";

export interface Phoneme {
  id: number;
  character: string;
  ipa_notation: string;
  tone_type: string;
  notes: string;
}

const FALLBACK_PHONEMES: Phoneme[] = [
  { id: 1, character: "a", ipa_notation: "ʌ", tone_type: "high/low/rising/falling/none", notes: "as in cut" },
  { id: 2, character: "b", ipa_notation: "b", tone_type: "none", notes: "as in bee" },
  { id: 3, character: "d", ipa_notation: "d", tone_type: "none", notes: "as in do" },
  { id: 4, character: "ɖ", ipa_notation: "ɖ", tone_type: "none", notes: "pronounced like a d but with the tip of the tongue bent back, pressed against the palate" },
  { id: 5, character: "e", ipa_notation: "ə", tone_type: "high/low/rising/falling/none", notes: "as in alive" },
  { id: 6, character: "ɛ", ipa_notation: "ɛ", tone_type: "high/low/rising/falling/none", notes: "as in end" },
  { id: 7, character: "f", ipa_notation: "f", tone_type: "none", notes: "as in fill" },
  { id: 8, character: "ƒ", ipa_notation: "ɸ", tone_type: "none", notes: "a voiceless bilabial fricative" },
  { id: 9, character: "g", ipa_notation: "g", tone_type: "none", notes: "as in game" },
  { id: 10, character: "ɣ", ipa_notation: "ɣ", tone_type: "none", notes: "a voiced palatal fricative" },
  { id: 11, character: "h", ipa_notation: "h", tone_type: "none", notes: "as in hot" },
  { id: 12, character: "x", ipa_notation: "x", tone_type: "none", notes: "a voiceless velar fricative" },
  { id: 13, character: "i", ipa_notation: "ɪ", tone_type: "high/low/rising/falling/none", notes: "as in silver" },
  { id: 14, character: "k", ipa_notation: "k", tone_type: "none", notes: "as in king" },
  { id: 15, character: "l", ipa_notation: "l", tone_type: "none", notes: "as in light" },
  { id: 16, character: "m", ipa_notation: "m", tone_type: "none", notes: "as in milk" },
  { id: 17, character: "n", ipa_notation: "n", tone_type: "none", notes: "as in near" },
  { id: 18, character: "ŋ", ipa_notation: "ŋ", tone_type: "none", notes: "as in thing" },
  { id: 19, character: "o", ipa_notation: "o", tone_type: "high/low/rising/falling/none", notes: "a closed o" },
  { id: 20, character: "ɔ", ipa_notation: "ɔ", tone_type: "high/low/rising/falling/none", notes: "an open o" },
  { id: 21, character: "p", ipa_notation: "p", tone_type: "none", notes: "as in palm" },
  { id: 22, character: "r", ipa_notation: "r", tone_type: "none", notes: "tip of the tongue" },
  { id: 23, character: "s", ipa_notation: "s", tone_type: "none", notes: "as in silver" },
  { id: 24, character: "t", ipa_notation: "t", tone_type: "none", notes: "as in town" },
  { id: 25, character: "u", ipa_notation: "u", tone_type: "high/low/rising/falling/none", notes: "as in you" },
  { id: 26, character: "v", ipa_notation: "v", tone_type: "none", notes: "as in victory" },
  { id: 27, character: "ʋ", ipa_notation: "β", tone_type: "none", notes: "a voiced bilabial fricative" },
  { id: 28, character: "w", ipa_notation: "w", tone_type: "none", notes: "as in water" },
  { id: 29, character: "y", ipa_notation: "j", tone_type: "none", notes: "as in yellow" },
  { id: 30, character: "z", ipa_notation: "z", tone_type: "none", notes: "as in zoo" }
];

let cachedPhonemes: Phoneme[] | null = null;
let phonemeMap: Record<string, string> | null = null;

export async function getPhonemeRules(): Promise<Record<string, string>> {
  if (phonemeMap) return phonemeMap;

  try {
    const data = await sql`SELECT id, character, ipa_notation, tone_type, notes FROM phonemes`;
    cachedPhonemes = data as Phoneme[];
  } catch (error) {
    console.error("Failed to load phonemes from DB for TTS rules, using fallback.", error);
    cachedPhonemes = FALLBACK_PHONEMES;
  }

  if (!cachedPhonemes || cachedPhonemes.length === 0) {
    cachedPhonemes = FALLBACK_PHONEMES;
  }

  // Build mapping from longest character sequence to shortest to avoid partial replacements
  // Currently all single characters, but handles future digraphs if added
  phonemeMap = {};
  
  // Sort by character length descending to replace "gb" before "g" and "b" (if digraphs exist)
  const sortedPhonemes = [...cachedPhonemes].sort((a, b) => b.character.length - a.character.length);
  
  for (const p of sortedPhonemes) {
    phonemeMap[p.character] = p.ipa_notation;
  }

  return phonemeMap;
}

const ESPEAK_PHONEME_MAP: Record<string, string> = {
  "a": "a", "b": "b", "d": "d", "ɖ": "d", "e": "e", "ɛ": "E",
  "f": "f", "ƒ": "f", "g": "g", "ɣ": "R", "h": "h", "x": "h",
  "i": "i", "k": "k", "l": "l", "m": "m", "n": "n", "ŋ": "N",
  "o": "o", "ɔ": "O", "p": "p", "r": "r", "s": "s", "t": "t",
  "u": "u", "v": "v", "ʋ": "v", "w": "w", "y": "j", "z": "z"
};

export async function textToIPA(text: string): Promise<string> {
  let result = text.toLowerCase();

  // Basic tone handling (simplification for v1)
  result = result.replace(/á/g, 'a[[^]]'); // high a
  result = result.replace(/é/g, 'e[[^]]'); // high e
  result = result.replace(/í/g, 'i[[^]]'); // high i
  result = result.replace(/ó/g, 'o[[^]]'); // high o
  result = result.replace(/ú/g, 'u[[^]]'); // high u

  let ipaString = "";
  let i = 0;
  
  // Sort keys by length descending for future digraph support
  const sortedKeys = Object.keys(ESPEAK_PHONEME_MAP).sort((a, b) => b.length - a.length);

  while (i < result.length) {
    let matched = false;
    for (const char of sortedKeys) {
      if (result.substring(i, i + char.length) === char) {
        ipaString += `[[${ESPEAK_PHONEME_MAP[char]}]]`;
        i += char.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      ipaString += result[i]; // keep spaces or punctuation
      i++;
    }
  }

  return ipaString;
}
