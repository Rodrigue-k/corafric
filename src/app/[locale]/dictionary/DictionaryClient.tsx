"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Search, Volume2, ShieldCheck, Database, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface DictionaryWord {
  id: string;
  word_ewe: string;
  word_fr: string;
  word_en: string;
  definition: string | null;
  audio_url: string | null;
  confidence_score: number;
  sources: string[];
}

export default function DictionaryClient() {
  const t = useTranslations("dictionary");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DictionaryWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalWords, setTotalWords] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dictionary${query ? `?q=${encodeURIComponent(query)}` : ""}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setResults(data);
          } else {
            setResults(data.words || []);
            if (typeof data.totalCount === "number") {
              setTotalWords(data.totalCount);
            }
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
  }, [query]);

  const handlePlayAudio = (id: string, audioUrl: string) => {
    if (playingId === id) return;
    setPlayingId(id);
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
  };

  return (
    <div className="w-full">
      {/* Total Words Counter Pill */}
      {totalWords !== null && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{totalWords} mots répertoriés dans le dictionnaire</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-3xl mb-12">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-text-muted/50" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="block w-full pl-12 pr-4 py-4 text-lg border border-border/80 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
        />
        <div className="absolute inset-y-2 right-2 flex items-center">
          {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin mr-3" />}
          <button className="px-6 h-full bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((word) => (
            <div
              key={word.id}
              className="bg-white border border-border/80 hover:border-primary/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-3xl font-bold font-display text-primary">
                    {word.word_ewe}
                  </h3>
                  {word.audio_url ? (
                    <button
                      onClick={() => handlePlayAudio(word.id, word.audio_url as string)}
                      disabled={playingId === word.id}
                      className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                        playingId === word.id
                          ? "bg-primary text-white border-primary animate-pulse"
                          : "bg-background text-primary border-border/80 hover:bg-primary hover:text-white"
                      }`}
                      title={t("listen")}
                    >
                      {playingId === word.id ? (
                        <Volume2 className="w-4 h-4 fill-current" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <span 
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium"
                      title="Aucune voix humaine enregistrée pour ce mot"
                    >
                      Pas d'audio
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-text-muted w-8">FR</span>
                    <span className="text-foreground">{word.word_fr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-text-muted w-8">EN</span>
                    <span className="text-foreground">{word.word_en}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Score : {word.confidence_score}</span>
                </div>
                {word.sources && word.sources.length > 0 && (
                  <div className="text-xs text-text-muted">
                    {word.sources.length} source{word.sources.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="bg-white border border-border/60 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-accent/60" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground mb-2">
            Aucun résultat
          </h3>
          <p className="text-text-muted max-w-md mx-auto">
            {t("noResults", { query })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
