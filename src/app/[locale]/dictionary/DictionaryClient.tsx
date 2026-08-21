"use client";

import React, { useState, useEffect } from "react";
import { Search, Volume2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface DictionaryWord {
  id: string;
  word_ewe: string;
  word_fr: string | null;
  word_en: string | null;
  definition: string | null;
  part_of_speech: string | null;
  example_sentence_ewe: string | null;
  example_sentence_fr: string | null;
  audio_url: string | null;
  confidence_score: number;
  sources: string[];
}

const EWE_ALPHABET = [
  "Tous", "A", "B", "D", "Ɖ", "E", "Ɛ", "F", "Ƒ", "G", "Ɣ", "H", "I", "K", "L", "M", "N", "Ŋ", "O", "Ɔ", "P", "R", "S", "T", "U", "V", "Ʋ", "W", "Y", "Z"
];

export default function DictionaryClient() {
  const t = useTranslations("dictionary");
  const [query, setQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("Tous");
  const [results, setResults] = useState<DictionaryWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 24;

  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true);
      try {
        let url = `/api/dictionary?page=${page}&limit=${limit}`;
        if (query) {
          url += `&q=${encodeURIComponent(query)}`;
        } else if (selectedLetter !== "Tous") {
          url += `&letter=${encodeURIComponent(selectedLetter)}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setResults(data);
          } else {
            setResults(data.words || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dictionary words", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchWords, 250);
    return () => clearTimeout(debounceTimer);
  }, [query, selectedLetter, page]);

  const handleLetterSelect = (letter: string) => {
    setQuery("");
    setSelectedLetter(letter);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedLetter("Tous");
    setPage(1);
  };

  const handlePlayAudio = (wordId: string, audioUrl: string) => {
    if (!audioUrl) return;
    setPlayingId(wordId);
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      {/* Editorial Header & Search */}
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <span className="text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-primary block">
            Patrimoine Lexical
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Big Search Input */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-transparent border-b-2 border-border/80 focus:border-primary text-xl sm:text-2xl font-display text-foreground py-3 pl-10 pr-10 outline-none transition-colors placeholder:text-text-muted/40"
          />
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/40" />
          {isLoading && (
            <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
          )}
        </div>

        {/* Clean Typography Alphabet Filter */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 max-w-3xl mx-auto pt-2">
          {EWE_ALPHABET.map((letter) => {
            const isSelected = selectedLetter === letter && !query;
            return (
              <button
                key={letter}
                onClick={() => handleLetterSelect(letter)}
                className={`text-sm sm:text-base font-display transition-colors px-1 py-0.5 cursor-pointer ${
                  isSelected
                    ? "text-primary font-bold underline underline-offset-4"
                    : "text-text-muted/60 hover:text-foreground"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lexical List — Flat, Clean, Card-free */}
      {results.length > 0 ? (
        <div className="flex flex-col border-t border-border/60">
          {results.map((word) => (
            <div
              key={word.id}
              className="group flex flex-col sm:flex-row sm:items-baseline justify-between py-6 sm:py-8 border-b border-border/60 hover:border-primary/40 transition-colors gap-4 sm:gap-8 relative"
            >
              {/* Left: Term & Audio */}
              <div className="flex flex-col sm:w-1/3 shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {word.word_ewe}
                  </h2>
                  {word.audio_url && (
                    <button
                      onClick={() => handlePlayAudio(word.id, word.audio_url as string)}
                      disabled={playingId === word.id}
                      className={`p-2 rounded-full transition-all cursor-pointer ${
                        playingId === word.id
                          ? "text-primary bg-primary/10"
                          : "text-text-muted/40 hover:text-primary hover:bg-primary/5"
                      }`}
                      title="Écouter la prononciation"
                      aria-label="Écouter"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {word.part_of_speech && (
                  <span className="text-xs italic text-text-muted mt-1 font-serif">
                    {word.part_of_speech}
                  </span>
                )}
              </div>

              {/* Right: Translations & Examples */}
              <div className="flex-grow flex flex-col justify-center space-y-2">
                <div className="space-y-1">
                  {word.word_fr && (
                    <p className="text-base sm:text-lg font-medium text-foreground">
                      {word.word_fr}
                    </p>
                  )}
                  {word.word_en && (
                    <p className="text-sm text-text-muted">
                      <span className="text-text-muted/60 text-xs uppercase tracking-widest mr-2">EN</span>
                      {word.word_en}
                    </p>
                  )}
                </div>

                {word.definition && !word.word_fr && (
                  <p className="text-sm text-text-muted italic">
                    {word.definition}
                  </p>
                )}

                {word.example_sentence_ewe && (
                  <p className="text-sm text-text-muted/80 pt-2 font-serif">
                    « {word.example_sentence_ewe} »
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="py-24 text-center border-y border-border/50">
          <p className="text-xl font-display text-text-muted/70 tracking-tight">{t("noResults")}</p>
        </div>
      ) : null}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
          className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-full bg-transparent border border-border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Précédent</span>
        </button>

        <span className="text-xs text-text-muted font-display tracking-widest uppercase">
          Page {page}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={results.length < limit || isLoading}
          className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-full bg-transparent border border-border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span>Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
