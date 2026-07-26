"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Search, Volume2, ShieldCheck, Loader2, ChevronLeft, ChevronRight, Quote, Info } from "lucide-react";
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
  "TOUS", "A", "B", "D", "Ð", "E", "Ɛ", "F", "Ƒ", "G", "Ɣ", "H", "I", "K", "L", "M", "N", "Ŋ", "O", "Ɔ", "P", "R", "S", "T", "U", "V", "Ʋ", "W", "Y", "Z"
];

export default function DictionaryClient() {
  const t = useTranslations("dictionary");
  const [query, setQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("TOUS");
  const [results, setResults] = useState<DictionaryWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalWords, setTotalWords] = useState<number | null>(null);
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 30;

  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true);
      try {
        let url = `/api/dictionary?page=${page}&limit=${limit}`;
        if (query) {
          url += `&q=${encodeURIComponent(query)}`;
        } else if (selectedLetter !== "TOUS") {
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

    const debounceTimer = setTimeout(fetchWords, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, selectedLetter, page]);

  const handleLetterSelect = (letter: string) => {
    setQuery("");
    setSelectedLetter(letter);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedLetter("TOUS");
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

  const effectiveCount = selectedLetter !== "TOUS" && filteredCount !== null ? filteredCount : totalWords;

  return (
    <div className="w-full space-y-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground">Dictionnaire Éwé Trilingue</h2>
          <p className="text-sm text-text-muted">Recherchez parmi des milliers de mots, leurs traductions et exemples en contexte.</p>
        </div>
        {totalWords !== null && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold shrink-0">
            <BookOpen className="w-4 h-4" />
            <span>{totalWords.toLocaleString()} mots répertoriés</span>
          </div>
        )}
      </div>

      {/* Alphabetical Index Filter Bar */}
      <div className="bg-white border border-border/80 rounded-2xl p-3 shadow-sm">
        <div className="text-xs font-semibold text-text-muted mb-2 px-1 uppercase tracking-wider">
          Index Alphabétique Éwé :
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {EWE_ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterSelect(letter)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                selectedLetter === letter && !query
                  ? "bg-primary text-white shadow-sm scale-105"
                  : "bg-background text-foreground hover:bg-primary/10 hover:text-primary border border-border/60"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-3xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted/50" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder={t("searchPlaceholder")}
          className="block w-full pl-12 pr-4 py-3.5 text-base border border-border/80 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
        />
        <div className="absolute inset-y-2 right-2 flex items-center">
          {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin mr-3" />}
          <button className="px-5 h-full bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors text-sm">
            Rechercher
          </button>
        </div>
      </div>

      {/* Results Header / Active Filter Info */}
      <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/50">
        <span>
          {selectedLetter !== "TOUS" && !query
            ? `Mots commençant par "${selectedLetter}" (${filteredCount ?? 0} trouvés)`
            : query
            ? `Résultats pour "${query}"`
            : `Affichage alphabétique (Page ${page})`}
        </span>
      </div>

      {/* Results Grid / List */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((word) => (
            <div
              key={word.id}
              className="bg-white border border-border/80 hover:border-primary/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Word Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold font-display text-primary flex items-baseline gap-2">
                      {word.word_ewe}
                      {word.part_of_speech && (
                        <span className="text-xs font-normal italic text-text-muted font-sans">
                          ({word.part_of_speech})
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Audio Status */}
                  {word.audio_url ? (
                    <button
                      onClick={() => handlePlayAudio(word.id, word.audio_url as string)}
                      disabled={playingId === word.id}
                      className={`p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                        playingId === word.id
                          ? "bg-primary text-white border-primary animate-pulse"
                          : "bg-background text-primary border-border/80 hover:bg-primary hover:text-white"
                      }`}
                      title={t("listen")}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium shrink-0"
                      title="Aucun audio humain enregistré"
                    >
                      Pas d'audio
                    </span>
                  )}
                </div>

                {/* Translations */}
                {word.word_fr || word.word_en ? (
                  <div className="space-y-1 bg-background/60 p-3 rounded-xl border border-border/40 text-xs">
                    {word.word_fr && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-muted w-6">FR</span>
                        <span className="text-foreground font-medium">{word.word_fr}</span>
                      </div>
                    )}
                    {word.word_en && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-muted w-6">EN</span>
                        <span className="text-foreground font-medium">{word.word_en}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs text-text-muted/70 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200/60">
                    <Info className="w-3.5 h-3.5" />
                    <span>En attente de traduction</span>
                  </div>
                )}

                {/* Definition */}
                {word.definition && (
                  <p className="text-xs text-text-muted italic line-clamp-2">
                    "{word.definition}"
                  </p>
                )}

                {/* Real Example Sentence in Context */}
                {word.example_sentence_ewe && (
                  <div className="mt-2 pt-2 border-t border-border/40 text-xs text-text-muted">
                    <div className="flex items-start gap-1.5 text-foreground/80 font-serif">
                      <Quote className="w-3.5 h-3.5 text-primary shrink-0 rotate-180 mt-0.5" />
                      <p className="italic line-clamp-2">{word.example_sentence_ewe}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Meta */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Score : {word.confidence_score}</span>
                </div>
                {word.sources && word.sources.length > 0 && (
                  <div className="text-text-muted truncate max-w-[120px]" title={word.sources.join(", ")}>
                    {word.sources.join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="bg-white border border-border/60 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
          <div className="w-14 h-14 bg-accent/5 rounded-full flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-accent/60" />
          </div>
          <h3 className="text-lg font-bold font-display text-foreground mb-1">
            Aucun mot trouvé
          </h3>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            {query ? `Aucun résultat pour "${query}".` : `Aucun mot enregistré pour l'index "${selectedLetter}".`}
          </p>
        </div>
      ) : null}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-6 border-t border-border/60">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-border/80 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </button>

        <span className="text-xs font-semibold text-text-muted">
          Page {page}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={results.length < limit || isLoading}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-border/80 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Suivant
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
