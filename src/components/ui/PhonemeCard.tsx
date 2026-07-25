"use client";

import React, { useState } from "react";
import { Play, Loader2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying || isLoading) return;

    try {
      setIsLoading(true);
      
      const audioUrl = window.location.origin + `/audios/${phoneme.character.toLowerCase()}.mp4?v=1`;
      const audio = new Audio(audioUrl);

      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = (e) => {
        console.error("Audio element error:", audio.error?.message || audio.error || e);
        setIsLoading(false);
        setIsPlaying(false);
      };

      audio.play().catch(error => {
        console.error("Audio playback rejected:", error);
        setIsLoading(false);
        setIsPlaying(false);
      });
    } catch (error) {
      console.error("Audio Engine error:", error);
      setIsLoading(false);
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

          {/* Action button: listen (discrete play icon or loader) */}
          <button
            onClick={handleSpeak}
            disabled={isLoading}
            className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
              isPlaying
                ? "bg-primary text-white border-primary animate-pulse"
                : "bg-background text-primary border-border/80 hover:bg-primary hover:text-white hover:border-primary"
            } disabled:opacity-70 disabled:cursor-not-allowed`}
            aria-label={t("listen")}
            title={t("listen")}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary hover:text-white" />
            ) : (
              <Play className={`w-3.5 h-3.5 fill-current ${isPlaying ? "text-white" : ""}`} />
            )}
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
    </div>
  );
};

