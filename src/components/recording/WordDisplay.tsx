import React from "react";
import { DictionaryWord } from "@/types";

interface WordDisplayProps {
  word: DictionaryWord;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({ word }) => {
  return (
    <div className="w-full text-center space-y-4 py-8 px-6 sm:px-10 rounded-2xl bg-white border border-border shadow-xs">
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Langue Éwé · Dictionnaire
        </span>
      </div>

      {/* Main Ewe Word */}
      <h2 className="text-3xl sm:text-5xl font-bold font-display text-foreground leading-tight tracking-tight">
        {word.word_ewe}
      </h2>

      {/* Meaning & Translation */}
      <div className="space-y-1 pt-1">
        {(word.word_fr || word.word_en) && (
          <p className="text-base sm:text-lg font-medium text-foreground">
            {word.word_fr || word.word_en}
          </p>
        )}
        {word.word_fr && word.word_en && (
          <p className="text-xs text-text-muted">
            Anglais : {word.word_en}
          </p>
        )}
        {word.definition && (
          <p className="text-xs text-text-muted italic max-w-md mx-auto pt-2">
            « {word.definition} »
          </p>
        )}
      </div>
    </div>
  );
};
