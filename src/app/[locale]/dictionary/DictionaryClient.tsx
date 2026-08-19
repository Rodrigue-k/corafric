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
    <div className="w-full space-y-5">
      {/* Compact Header & Controls Bar */}
      <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
              Dictionnaire Trilingue Éwé
            </h1>
            <p className="text-xs text-text-muted">
              {totalWords !== null
                ? `${totalWords.toLocaleString()} termes répertoriés · Éwé - Français - Anglais`
                : "Base de données lexicale de référence"}
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Rechercher un mot..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-border rounded-lg bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-primary transition-colors"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary animate-spin" />
            )}
          </div>
        </div>

        {/* Compact Horizontal Alphabet Scroller */}
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
            {EWE_ALPHABET.map((letter) => {
              const isSelected = selectedLetter === letter && !query;
              return (
                <button
                  key={letter}
                  onClick={() => handleLetterSelect(letter)}
                  className={`px-2.5 py-1 rounded-md shrink-0 font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-white font-semibold"
                      : "text-text-muted hover:text-foreground hover:bg-[#FAF8F5]"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header Info */}
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>
          {selectedLetter !== "Tous" && !query
            ? `Lettre "${selectedLetter}" · ${filteredCount ?? 0} résultat${(filteredCount ?? 0) > 1 ? "s" : ""}`
            : query
            ? `Recherche "${query}"`
            : `Affichage général (Page ${page})`}
        </span>
      </div>

      {/* Uniform, Sleek Word Cards Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {results.map((word) => (
            <div
              key={word.id}
              className="bg-white border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-border/90 transition-colors min-h-[140px] shadow-xs"
            >
              <div className="space-y-2">
                {/* Header: Word & Audio */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold font-display text-foreground truncate">
                      {word.word_ewe}
                    </h2>
                    {word.part_of_speech && (
                      <span className="text-[11px] italic text-text-muted block">
                        {word.part_of_speech}
                      </span>
                    )}
                  </div>

                  {word.audio_url && (
                    <button
                      onClick={() => handlePlayAudio(word.id, word.audio_url as string)}
                      disabled={playingId === word.id}
                      className={`p-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                        playingId === word.id
                          ? "bg-primary text-white border-primary"
                          : "bg-[#FAF8F5] text-text-muted border-border hover:text-primary hover:border-primary/40"
                      }`}
                      title="Écouter la prononciation"
                      aria-label="Écouter"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Translation List */}
                <div className="space-y-1 text-xs">
                  {word.word_fr && (
                    <p className="font-medium text-foreground">
                      <span className="text-text-muted font-normal mr-1.5">FR:</span>
                      {word.word_fr}
                    </p>
                  )}
                  {word.word_en && (
                    <p className="text-text-muted">
                      <span className="text-text-muted/70 font-normal mr-1.5">EN:</span>
                      {word.word_en}
                    </p>
                  )}
                </div>

                {/* Optional definition or example */}
                {word.definition && !word.word_fr && (
                  <p className="text-xs text-text-muted italic line-clamp-2 pt-1">
                    {word.definition}
                  </p>
                )}
                {word.example_sentence_ewe && (
                  <p className="text-[11px] text-text-muted italic line-clamp-1 pt-1 border-t border-border/50">
                    « {word.example_sentence_ewe} »
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">Aucun résultat trouvé</p>
          <p className="text-xs text-text-muted">
            {query
              ? `Aucune correspondance pour "${query}".`
              : `Aucun mot répertorié pour la lettre "${selectedLetter}".`}
          </p>
        </div>
      ) : null}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-border hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Précédent
        </button>

        <span className="text-xs text-text-muted font-mono">
          Page {page}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={results.length < limit || isLoading}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-border hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Suivant
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
