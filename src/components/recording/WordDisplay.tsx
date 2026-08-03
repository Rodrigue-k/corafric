import React from "react";
import { DictionaryWord } from "@/types";

interface WordDisplayProps {
  word: DictionaryWord;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({ word }) => {
  return (
    <div className="w-full text-center space-y-2 py-5 px-6 rounded-2xl bg-card border border-border shadow-sm">
      <span className="text-[10px] font-semibold text-primary uppercase tracking-widest block">
        Éwé (ɛʋɛgbɛ)
      </span>
      <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground leading-snug">
        {word.word_ewe}
      </h2>
      <div className="space-y-0.5">
        {word.word_fr && (
          <p className="text-sm text-foreground font-medium">
            {word.word_fr}
          </p>
        )}
        {word.word_en && (
          <p className="text-xs text-text-muted">
            {word.word_en}
          </p>
        )}
      </div>
      {word.definition && (
        <p className="text-[11px] text-text-muted italic max-w-md mx-auto pt-1">
          "{word.definition}"
        </p>
      )}
    </div>
  );
};
