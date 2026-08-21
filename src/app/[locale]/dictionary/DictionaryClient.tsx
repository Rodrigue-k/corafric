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
  const [totalWords, setTotalWords] = useState<number | null>(null);
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
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
            if (typeof data.totalCount === "number") {
              setTotalWords(data.totalCount);
            }
            setFilteredCount(data.filteredCount ?? null);
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

    if (letter !== "Tous") {
      const audioUrl = `/audios/${letter.toLowerCase()}.mp4`;
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {});
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedLetter("Tous");
    setPage(1);
  };

  const handlePlayAudio = (id: string, audioUrl: string) => {
    if (playingId === id) return;
    setPlayingId(id);
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
  };

  return (
    <div className="w-full space-y-12 pb-12">
      {/* Editorial Header */}
      <div className="space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted max-w-xl mx-auto">
            {totalWords !== null
              ? `${totalWords.toLocaleString()} mots validés. ${t("subtitle")}`
              : t("subtitle")}
          </p>
        </div>

        {/* Minimalist Search Input */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={t("searchPlaceholder")}
            className="w-full py-4 text-xl sm:text-2xl font-display font-medium text-center border-b-2 border-border/60 bg-transparent focus:outline-none focus:border-primary transition-colors placeholder:text-border/80"
          />
          {isLoading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
          )}
        </div>

        {/* Typography-Driven Alphabet Filter */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 max-w-4xl mx-auto">
          {EWE_ALPHABET.map((letter) => {
            const isSelected = selectedLetter === letter && !query;
            return (
              <button
                key={letter}
                onClick={() => handleLetterSelect(letter)}
                className={`text-lg sm:text-xl font-display transition-all duration-300 ${
                  isSelected
                    ? "text-primary font-bold scale-110"
                    : "text-text-muted/60 hover:text-foreground"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editorial Lexical List - No Cards */}
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
        <div className="py-32 text-center border-y border-border/50">
          <p className="text-2xl font-display text-text-muted/60 tracking-tight">{t("noResults")}</p>
        </div>
      ) : null}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full bg-transparent border border-border hover:bg-border/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-sm text-text-muted font-display tracking-widest">
          {page}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={results.length < limit || isLoading}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full bg-transparent border border-border hover:bg-border/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
