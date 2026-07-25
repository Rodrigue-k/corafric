"use client";

import React, { useState, useRef, useEffect } from "react";
import { ConcatenativePlayer } from "@/lib/tts/concatenativePlayer";
import { Volume2, Square, Sparkles, AudioWaveform } from "lucide-react";

export const WordSpellerCard: React.FC = () => {
  const [inputText, setInputText] = useState("Corafric");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null);
  const playerRef = useRef<ConcatenativePlayer | null>(null);

  const [playbackMode, setPlaybackMode] = useState<"read" | "spell">("read");

  useEffect(() => {
    playerRef.current = new ConcatenativePlayer();
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  const handlePlay = (mode: "read" | "spell") => {
    if (!playerRef.current || !inputText.trim()) return;

    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      setActiveCharIndex(null);
      return;
    }

    setIsPlaying(true);
    setPlaybackMode(mode);
    setActiveCharIndex(null);

    playerRef.current.playSequence(inputText, {
      mode,
      pauseMs: mode === "spell" ? 140 : 0,
      onCharacter: (_char, index) => {
        setActiveCharIndex(index);
      },
      onEnded: () => {
        setIsPlaying(false);
        setActiveCharIndex(null);
      },
      onError: () => {
        setIsPlaying(false);
        setActiveCharIndex(null);
      },
    });
  };

  const characters = inputText.split("");

  return (
    <div className="bg-gradient-to-br from-primary-tint/40 via-background to-accent/10 border border-primary/20 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 relative overflow-hidden">
      {/* Visual Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary text-white rounded-xl shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-h3 font-display text-foreground">
              Moteur de Synthèse par Concaténation
            </h3>
            <p className="text-caption text-text-muted">
              Assemblage et fusion audio des phonèmes pour lire ou épeler n&apos;importe quel mot
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
          <AudioWaveform className="w-4 h-4 animate-pulse" />
          <span>Fusion Web Audio API</span>
        </div>
      </div>

      {/* Input and Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tapez un mot (ex: Corafric, Ewe, Togo, ɖɛ...)"
          disabled={isPlaying}
          className="w-full px-4 py-3 bg-white border border-border rounded-xl font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 text-lg"
        />

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={() => handlePlay("read")}
            disabled={!inputText.trim()}
            className={`px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              isPlaying && playbackMode === "read"
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                : "bg-primary hover:bg-primary-dark text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPlaying && playbackMode === "read" ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Arrêter</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Prononcer le mot</span>
              </>
            )}
          </button>

          <button
            onClick={() => handlePlay("spell")}
            disabled={!inputText.trim()}
            className={`px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm border cursor-pointer ${
              isPlaying && playbackMode === "spell"
                ? "bg-red-600 hover:bg-red-700 text-white border-red-600 animate-pulse"
                : "bg-white hover:bg-primary-tint/30 text-foreground border-border"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPlaying && playbackMode === "spell" ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Arrêter</span>
              </>
            ) : (
              <span>Épeler</span>
            )}
          </button>
        </div>
      </div>

      {/* Visual character breakdown pill row */}
      {characters.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 items-center">
          <span className="text-xs font-semibold text-text-muted uppercase mr-2">Séquence :</span>
          {characters.map((char, idx) => (
            <span
              key={idx}
              className={`px-3 py-1.5 rounded-lg text-lg font-bold font-display transition-all duration-200 border ${
                activeCharIndex === idx
                  ? "bg-primary text-white border-primary scale-110 shadow-lg shadow-primary/30 ring-2 ring-primary/40"
                  : "bg-white text-foreground border-border/80"
              }`}
            >
              {char}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
