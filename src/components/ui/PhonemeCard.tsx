"use client";

import React, { useState } from "react";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

interface Phoneme {
  id: number;
  character: string;
  ipa_notation: string;
  tone_type: string;
  notes: string;
}

export const PhonemeCard: React.FC<{ phoneme: Phoneme }> = ({ phoneme }) => {
  const t = useTranslations("alphabet");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFallbackMsg, setShowFallbackMsg] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      
      const textToSpeak = phoneme.character;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "ee";

      const voices = window.speechSynthesis.getVoices();
      const hasEweVoice = voices.some(
        (v) => v.lang.startsWith("ee") || v.lang.toLowerCase().includes("ewe")
      );

      if (!hasEweVoice) {
        utterance.lang = "fr-FR";
        setShowFallbackMsg(true);
        setTimeout(() => setShowFallbackMsg(false), 2500);
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech Synthesis error:", error);
      setIsPlaying(false);
    }
  };

  const hasTones = phoneme.tone_type && phoneme.tone_type !== "none";

  return (
    <div className="relative group bg-white hover:bg-primary-tint/20 rounded-2xl border border-border/80 hover:border-primary/30 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Geometric background decoration for depth (zero flat background rule) */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-accent/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      
      <div>
        <div className="flex justify-between items-start">
          <div>
            {/* Character in large size (Playfair Display, terracotta) */}
            <h3 className="text-5xl font-bold font-display text-primary leading-none tracking-tight mb-2">
              {phoneme.character}
            </h3>
            {/* IPA notation (Inter) */}
            <p className="text-xs font-mono font-medium text-text-muted/80 bg-black/5 px-2 py-0.5 rounded-md inline-block">
              /{phoneme.ipa_notation}/
            </p>
          </div>

          {/* Action button: listen (discrete play icon) */}
          <button
            onClick={handleSpeak}
            className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
              isPlaying
                ? "bg-primary text-white border-primary animate-pulse"
                : "bg-background text-primary border-border/80 hover:bg-primary hover:text-white hover:border-primary"
            }`}
            aria-label={t("listen")}
            title={t("listen")}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isPlaying ? "text-white" : ""}`} />
          </button>
        </div>

        {/* Notes (pronunciation description) */}
        <p className="text-sm text-foreground/90 font-sans mt-5 mb-2 leading-relaxed">
          {phoneme.notes}
        </p>
      </div>

      {/* Tone details */}
      <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap gap-2 items-center text-xs font-sans">
        {hasTones ? (
          <span className="bg-accent/15 text-accent font-medium px-2.5 py-0.5 rounded-full border border-accent/20">
            {t("tone")} {phoneme.tone_type}
          </span>
        ) : (
          <span className="text-text-muted/65 font-medium bg-black/5 px-2.5 py-0.5 rounded-full">
            {t("tone")} Statique
          </span>
        )}
      </div>

      {/* Floating Temporary Fallback Voice Message */}
      {showFallbackMsg && (
        <div className="absolute bottom-2 left-2 right-2 bg-foreground text-background text-[10px] text-center py-1 rounded px-2 animate-fade-in z-10 shadow-lg">
          {t("fallbackWarning")}
        </div>
      )}
    </div>
  );
};
