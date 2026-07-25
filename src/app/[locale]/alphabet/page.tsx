import React from "react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { sql } from "@/lib/db";
import { PhonemeCard } from "@/components/ui/PhonemeCard";
import { WordSpellerCard } from "@/components/ui/WordSpellerCard";

interface Phoneme {
  id: number;
  character: string;
  ipa_notation: string;
  tone_type: string;
  notes: string;
}

// Fallback phoneme list in case database is offline or empty
const FALLBACK_PHONEMES: Phoneme[] = [
  { id: 1, character: "a", ipa_notation: "ʌ", tone_type: "high/low/rising/falling/none", notes: "as in cut" },
  { id: 2, character: "b", ipa_notation: "b", tone_type: "none", notes: "as in bee" },
  { id: 3, character: "d", ipa_notation: "d", tone_type: "none", notes: "as in do" },
  { id: 4, character: "ɖ", ipa_notation: "ɖ", tone_type: "none", notes: "pronounced like a d but with the tip of the tongue bent back, pressed against the palate" },
  { id: 5, character: "e", ipa_notation: "ə", tone_type: "high/low/rising/falling/none", notes: "as in alive" },
  { id: 6, character: "ɛ", ipa_notation: "ɛ", tone_type: "high/low/rising/falling/none", notes: "as in end" },
  { id: 7, character: "f", ipa_notation: "f", tone_type: "none", notes: "as in fill" },
  { id: 8, character: "ƒ", ipa_notation: "ɸ", tone_type: "none", notes: "a voiceless bilabial fricative, i.e. a harsh blow with lips nearly closed" },
  { id: 9, character: "g", ipa_notation: "g", tone_type: "none", notes: "as in game" },
  { id: 10, character: "ɣ", ipa_notation: "ɣ", tone_type: "none", notes: "a voiced palatal fricative, i.e. pronounced like a g but with a friction between tongue and palate (like in Dutch gaan)" },
  { id: 11, character: "h", ipa_notation: "h", tone_type: "none", notes: "as in hot" },
  { id: 12, character: "x", ipa_notation: "x", tone_type: "none", notes: "a voiceless velar fricative, like in German lachen" },
  { id: 13, character: "i", ipa_notation: "ɪ", tone_type: "high/low/rising/falling/none", notes: "as in silver" },
  { id: 14, character: "k", ipa_notation: "k", tone_type: "none", notes: "as in king" },
  { id: 15, character: "l", ipa_notation: "l", tone_type: "none", notes: "as in light" },
  { id: 16, character: "m", ipa_notation: "m", tone_type: "none", notes: "as in milk" },
  { id: 17, character: "n", ipa_notation: "n", tone_type: "none", notes: "as in near" },
  { id: 18, character: "ŋ", ipa_notation: "ŋ", tone_type: "none", notes: "as in thing" },
  { id: 19, character: "o", ipa_notation: "o", tone_type: "high/low/rising/falling/none", notes: "a closed o, like in Italian rotto" },
  { id: 20, character: "ɔ", ipa_notation: "ɔ", tone_type: "high/low/rising/falling/none", notes: "an open o, like in hot" },
  { id: 21, character: "p", ipa_notation: "p", tone_type: "none", notes: "as in palm" },
  { id: 22, character: "r", ipa_notation: "r", tone_type: "none", notes: "pronounced with the tip of the tongue (like in Italian rosso)" },
  { id: 23, character: "s", ipa_notation: "s", tone_type: "none", notes: "as in silver" },
  { id: 24, character: "t", ipa_notation: "t", tone_type: "none", notes: "as in town" },
  { id: 25, character: "u", ipa_notation: "u", tone_type: "high/low/rising/falling/none", notes: "as in you, but short" },
  { id: 26, character: "v", ipa_notation: "v", tone_type: "none", notes: "as in victory" },
  { id: 27, character: "ʋ", ipa_notation: "β", tone_type: "none", notes: "a voiced bilabial fricative, i.e. a soft blow with lips nearly closed" },
  { id: 28, character: "w", ipa_notation: "w", tone_type: "none", notes: "as in water" },
  { id: 29, character: "y", ipa_notation: "j", tone_type: "none", notes: "as in yellow" },
  { id: 30, character: "z", ipa_notation: "z", tone_type: "none", notes: "as in zoo" }
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "alphabet" });
  return {
    title: `${t("title")} — Corafric`,
    description: t("subtitle"),
  };
}

export default async function AlphabetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "alphabet" });

  let phonemes: Phoneme[] = [];
  try {
    const data = await sql`
      SELECT id, character, ipa_notation, tone_type, notes 
      FROM phonemes 
      ORDER BY id
    `;
    phonemes = data as Phoneme[];
  } catch (error) {
    console.error("Error querying phonemes table, using fallback:", error);
  }

  if (!phonemes || phonemes.length === 0) {
    phonemes = FALLBACK_PHONEMES;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans relative overflow-hidden">
      {/* Decorative Geometric Background Shapes for depth */}
      <div className="absolute top-20 left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-[-10%] w-[45%] h-[45%] bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-[45%] w-72 h-72 border border-primary/5 rounded-full pointer-events-none -z-10 animate-pulse duration-[6000ms]" />
      
      <Navbar />

      <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 relative">
          {/* Subtle gold line accent */}
          <div className="w-16 h-1 bg-accent mx-auto mb-6 rounded-full" />
          
          <h1 className="text-display text-foreground font-display tracking-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-lg sm:text-xl text-text-muted/80 font-sans leading-relaxed font-light">
            {t("subtitle")}
          </p>
        </div>

        {/* Interactive Word Speller (Concatenative Engine Demo) */}
        <div className="mb-12">
          <WordSpellerCard />
        </div>

        {/* Letters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {phonemes.map((phoneme) => (
            <PhonemeCard key={phoneme.id} phoneme={phoneme} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
