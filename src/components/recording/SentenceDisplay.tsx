import React from "react";
import { Sentence } from "@/types";

interface SentenceDisplayProps {
  sentence: Sentence;
}

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({ sentence }) => {
  const frenchTranslation = sentence.translation_fr || null;

  return (
    <div className="w-full text-center space-y-5 py-12">
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Langue Éwé
        </span>
        {sentence.source && (
          <>
            <span className="text-border">·</span>
            <span className="text-xs text-text-muted hidden sm:inline">
              Source : {sentence.source.replace(/^https?:\/\//, "").split("/")[0]}
            </span>
          </>
        )}
      </div>

      {/* Main Sentence */}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-foreground leading-snug tracking-tight max-w-2xl mx-auto">
        « {sentence.text} »
      </h2>

      {/* French Translation if available */}
      {frenchTranslation && (
        <p className="text-sm text-text-muted italic max-w-lg mx-auto">
          Traduction : {frenchTranslation}
        </p>
      )}
    </div>
  );
};
