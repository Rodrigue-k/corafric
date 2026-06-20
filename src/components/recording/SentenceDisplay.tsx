import React from "react";
import { Sentence } from "@/types";

interface SentenceDisplayProps {
  sentence: Sentence;
}

// Simple mapping of standard sentences to French translations for mock / UI representation
const TRANSLATION_MAP: Record<string, string> = {
  "Ndi na wò.": "Bonjour (à toi).",
  "Efoa? — Ẽ, mefo.": "Comment vas-tu ? — Oui, je vais bien.",
  "Akpe kaka na mi katã.": "Merci beaucoup à vous tous.",
  "Mia dogo le ŋkeke siwo gbɔna me.": "On se verra dans les jours à venir.",
  "Eapɔ tsi noa?": "Veux-tu boire de l'eau ?",
  "Fia mɔm kple taflatse.": "S'il te plaît, montre-moi le chemin.",
  "Nuɖuɖu le anyi na wò.": "Il y a de la nourriture pour toi.",
  "Afikae wòtso?": "D'où viens-tu ?",
  "Me lɔ̃ wò vevie.": "Je t'aime beaucoup.",
  "Dɔdɔ le ku dzi.": "Le sommeil est comme la mort."
};

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({ sentence }) => {
  const frenchTranslation = TRANSLATION_MAP[sentence.text] || "Traduction non disponible.";

  return (
    <div className="w-full text-center space-y-4 py-8 px-6 rounded-2xl bg-primary-tint/20 border border-primary/10">
      <span className="text-label text-primary font-semibold tracking-widest block">
        Phrase en Ewe (ɛʋɛgbɛ)
      </span>
      <h2 className="text-display text-2xl md:text-3xl font-bold font-display text-foreground leading-snug">
        {sentence.text}
      </h2>
      <p className="text-body text-text-muted italic">
        {frenchTranslation}
      </p>
    </div>
  );
};
