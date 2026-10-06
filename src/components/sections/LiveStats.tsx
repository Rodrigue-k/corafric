"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { GlobalStats } from "@/types";
import { Button } from "../ui/Button";

export function LiveStats() {
  const t = useTranslations("landing");
  const [stats, setStats] = useState<GlobalStats>({
    totalRecordings: 0,
    approvedRecordings: 0,
    totalUsers: 0,
    totalHours: 0,
    totalSentences: 1100,
    words: {
      total: 1350,
      validated: 0,
      withAudio: 0,
    },
    sentences: {
      total: 1100,
      validated: 0,
      withAudio: 0,
    },
  });

  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    async function fetchLiveStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (!ignore && data) {
          setStats((prev) => ({
            ...prev,
            ...data,
            words: data.words || prev.words,
            sentences: data.sentences || prev.sentences,
          }));
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("Error fetching live stats:", err);
      }
    }

    void fetchLiveStats();
    return () => {
      ignore = true;
    };
  }, []);

  const wordTotal = stats.words?.total || 1350;
  const wordValidated = stats.words?.validated || 0;
  const wordAudio = stats.words?.withAudio || stats.approvedRecordings || 0;
  const wordValidatedPercent = Math.min(100, Math.round((wordValidated / Math.max(1, wordTotal)) * 100));
  const wordAudioPercent = Math.min(100, Math.round((wordAudio / Math.max(1, wordTotal)) * 100));

  const sentenceTotal = stats.sentences?.total || stats.totalSentences || 1100;
  const sentenceValidated = stats.sentences?.validated || 0;
  const sentenceAudio = stats.sentences?.withAudio || 0;
  const sentenceValidatedPercent = Math.min(100, Math.round((sentenceValidated / Math.max(1, sentenceTotal)) * 100));
  const sentenceAudioPercent = Math.min(100, Math.round((sentenceAudio / Math.max(1, sentenceTotal)) * 100));

  return (
    <section className="bg-[#FAF8F5] min-h-[calc(100dvh-64px)] flex flex-col justify-center py-10 sm:py-14 border-b border-border/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-between space-y-10 lg:space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border/60">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary block font-display">
              {t("badge")}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-foreground tracking-tight">
              {t("pipelineTitle")}
            </h2>
          </div>
          <Link href="/dictionary">
            <Button variant="primary" size="md" className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-xs whitespace-nowrap h-11">
              {t("ctaPrimary")}
            </Button>
          </Link>
        </div>

        {/* Pure Editorial Split with Architectural Hatch-Pattern Gauges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/60 gap-10 lg:gap-0">
          
          {/* Column 1 : Dictionnaire Lexical */}
          <div className="lg:pr-12 space-y-6 pt-4 lg:pt-0">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                01 · {t("dictionaryPipeline")}
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight tabular-nums">
                  {wordTotal.toLocaleString()}
                </span>
                <span className="text-sm sm:text-base text-text-muted font-display">
                  {t("wordsUnit")} indexés au total
                </span>
              </div>
            </div>

            {/* Architectural Gauges */}
            <div className="space-y-5">
              {/* Gauge 1: Validation Sémantique */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground font-semibold">
                    1. Mots validés & certifiés
                  </span>
                  <span className="font-mono text-text-muted">
                    {wordValidated.toLocaleString()} / {wordTotal.toLocaleString()} ({wordValidatedPercent}%)
                  </span>
                </div>
                <div className="h-10 sm:h-11 w-full bg-[#EFE9E1] border border-[#DACDC0] rounded-[2px] overflow-hidden p-1 relative flex items-center">
                  <div
                    className="h-full hatch-emerald rounded-[1px] transition-all duration-300"
                    style={{ width: `${wordValidatedPercent}%` }}
                  />
                  {wordValidatedPercent === 0 && (
                    <span className="absolute left-3 text-[11px] font-mono text-text-muted/70 italic">
                      En cours de validation
                    </span>
                  )}
                </div>
              </div>

              {/* Gauge 2: Audio Studio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground font-semibold">
                    2. Enregistrement audio studio
                  </span>
                  <span className="font-mono text-primary font-bold">
                    {wordAudio.toLocaleString()} / {wordTotal.toLocaleString()} ({wordAudioPercent}%)
                  </span>
                </div>
                <div className="h-10 sm:h-11 w-full bg-[#EFE9E1] border border-[#DACDC0] rounded-[2px] overflow-hidden p-1 relative flex items-center">
                  <div
                    className="h-full hatch-primary rounded-[1px] transition-all duration-300"
                    style={{ width: `${wordAudioPercent}%` }}
                  />
                  {wordAudioPercent === 0 && (
                    <span className="absolute left-3 text-[11px] font-mono text-primary/70 italic">
                      Enregistrements en cours
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Link href="/dictionary" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                <span>Consulter le dictionnaire</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Column 2 : Corpus Textuel */}
          <div className="lg:pl-12 space-y-6 pt-6 lg:pt-0">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                02 · {t("sentencesPipeline")}
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight tabular-nums">
                  {sentenceTotal.toLocaleString()}
                </span>
                <span className="text-sm sm:text-base text-text-muted font-display">
                  {t("sentencesUnit")} collectées au total
                </span>
              </div>
            </div>

            {/* Architectural Gauges */}
            <div className="space-y-5">
              {/* Gauge 1: Nettoyage & Validation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground font-semibold">
                    1. Phrases validées & nettoyées
                  </span>
                  <span className="font-mono text-text-muted">
                    {sentenceValidated.toLocaleString()} / {sentenceTotal.toLocaleString()} ({sentenceValidatedPercent}%)
                  </span>
                </div>
                <div className="h-10 sm:h-11 w-full bg-[#EFE9E1] border border-[#DACDC0] rounded-[2px] overflow-hidden p-1 relative flex items-center">
                  <div
                    className="h-full hatch-emerald rounded-[1px] transition-all duration-300"
                    style={{ width: `${sentenceValidatedPercent}%` }}
                  />
                  {sentenceValidatedPercent === 0 && (
                    <span className="absolute left-3 text-[11px] font-mono text-text-muted/70 italic">
                      En cours de révision
                    </span>
                  )}
                </div>
              </div>

              {/* Gauge 2: Audio Studio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground font-semibold">
                    2. Enregistrement audio studio
                  </span>
                  <span className="font-mono text-[#A67809] font-bold">
                    {sentenceAudio.toLocaleString()} / {sentenceTotal.toLocaleString()} ({sentenceAudioPercent}%)
                  </span>
                </div>
                <div className="h-10 sm:h-11 w-full bg-[#EFE9E1] border border-[#DACDC0] rounded-[2px] overflow-hidden p-1 relative flex items-center">
                  <div
                    className="h-full hatch-gold rounded-[1px] transition-all duration-300"
                    style={{ width: `${sentenceAudioPercent}%` }}
                  />
                  {sentenceAudioPercent === 0 && (
                    <span className="absolute left-3 text-[11px] font-mono text-[#A67809]/80 italic">
                      Enregistrements en cours
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Link href="/explore" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                <span>Explorer le corpus</span>
                <span>→</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Global Editorial Metric Line */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border/60">
          <div className="border-l-2 border-primary/60 pl-4">
            <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Mots du Lexique</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground tabular-nums">
              {wordTotal.toLocaleString()}+
            </p>
          </div>
          <div className="border-l-2 border-border/80 pl-4">
            <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Phrases Complètes</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground tabular-nums">
              {sentenceTotal.toLocaleString()}+
            </p>
          </div>
          <div className="border-l-2 border-border/80 pl-4">
            <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Tonalités Éwé</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground tabular-nums">
              100%
            </p>
          </div>
          <div className="border-l-2 border-border/80 pl-4">
            <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Format Audio</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground tabular-nums">
              48 kHz
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
