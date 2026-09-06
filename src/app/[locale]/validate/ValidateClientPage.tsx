"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ValidationCard } from "@/components/validation/ValidationCard";
import { ComparativeValidationCard } from "@/components/validation/ComparativeValidationCard";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2, LayoutList, Layers, Mic } from "lucide-react";
import { Link } from "@/i18n/routing";

interface SingleRecording {
  id: string;
  audioUrl: string;
  sentence: { text: string; language: string };
  word?: { text: string; translation?: string; definition?: string };
}

interface ComparativeRecording extends SingleRecording {
  label: string;
}

type ValidationMode = "single" | "comparative";

export default function ValidateClientPage() {
  const t = useTranslations("validate");
  const [mode, setMode] = useState<ValidationMode>("single");
  const [recording, setRecording] = useState<SingleRecording | null>(null);
  const [comparativeRecordings, setComparativeRecordings] = useState<ComparativeRecording[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [totalValidations, setTotalValidations] = useState<number | null>(null);

  // Fetch user cumulative validations
  useEffect(() => {
    async function fetchUserStats() {
      try {
        const res = await fetch("/api/me/stats");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.totalValidations === "number") {
            setTotalValidations(data.totalValidations);
          }
        }
      } catch {
        // Guest user or network error
      }
    }
    void fetchUserStats();
  }, []);

  const fetchNext = useCallback(async (currentMode: ValidationMode) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setRecording(null);
      setComparativeRecordings([]);

      const url = currentMode === "comparative"
        ? "/api/recordings/next?mode=comparative"
        : "/api/recordings/next";

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Veuillez vous connecter pour valider des audios.");
        }
        const text = await res.text();
        let errMsg = "Erreur lors de la récupération des enregistrements.";
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          // Response is HTML (error page)
        }
        throw new Error(errMsg);
      }

      const data = await res.json() as {
        error?: string;
        mode?: string;
        recording?: SingleRecording;
        recordings?: ComparativeRecording[];
      };

      if (data.error) throw new Error(data.error);


      if (data.mode === "comparative" && data.recordings && data.recordings.length > 0) {
        setComparativeRecordings(data.recordings);
      } else if (data.recording) {
        setRecording(data.recording);
      } else {
        // No recordings available
        setRecording(null);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNext(mode);
  }, [fetchNext, mode]);

  const handleVoteSubmitted = () => {
    setSessionCount((prev) => prev + 1);
    setTotalValidations((prev) => (prev !== null ? prev + 1 : null));
    void fetchNext(mode);
  };

  const handleModeChange = (newMode: ValidationMode) => {
    setMode(newMode);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs text-text-muted mt-0.5">{t("instruction")}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
            {totalValidations !== null ? "Total validés" : "Session"}
          </span>
          <span className="text-sm font-mono font-bold text-foreground">
            {totalValidations !== null
              ? totalValidations
              : sessionCount}
          </span>
          {totalValidations !== null && sessionCount > 0 && (
            <span className="text-[10px] text-primary font-mono block">
              +{sessionCount} cette session
            </span>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 p-1 bg-[#FAF8F5] border border-border/50 rounded-full w-fit mx-auto">
        <button
          onClick={() => handleModeChange("single")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-display font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            mode === "single"
              ? "bg-foreground text-white shadow-sm"
              : "text-text-muted hover:text-foreground"
          }`}
        >
          <LayoutList className="w-3.5 h-3.5" />
          Simple
        </button>
        <button
          onClick={() => handleModeChange("comparative")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-display font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            mode === "comparative"
              ? "bg-foreground text-white shadow-sm"
              : "text-text-muted hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Comparatif
        </button>
      </div>

      {/* Main Validation Area */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] gap-2.5 border-y border-border/40 py-12">
            <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-text-muted font-display uppercase tracking-wider">
              Chargement de l&apos;audio...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="max-w-md mx-auto py-12 text-center space-y-3 border-y border-border/40">
            <AlertCircle className="w-7 h-7 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">{errorMessage}</p>
            <Button onClick={() => fetchNext(mode)} variant="secondary" size="sm" className="rounded-full">
              Réessayer
            </Button>
          </div>
        ) : mode === "comparative" && comparativeRecordings.length > 0 ? (
          <ComparativeValidationCard
            recordings={comparativeRecordings}
            onAllVotesSubmitted={handleVoteSubmitted}
          />
        ) : recording ? (
          <ValidationCard
            recording={recording}
            onVoteSubmitted={handleVoteSubmitted}
          />
        ) : (
          <div className="max-w-lg mx-auto py-12 px-6 text-center space-y-5 border border-border/70 rounded-2xl bg-[#FAF8F5]/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight">
                {t("emptyTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                {t("emptyDesc")}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/contribute">
                <Button variant="primary" size="md" className="rounded-full px-6 gap-2">
                  <Mic className="w-4 h-4" />
                  <span>{t("emptyCta")}</span>
                </Button>
              </Link>
              <Button onClick={() => fetchNext(mode)} variant="secondary" size="md" className="rounded-full px-5">
                Actualiser la file
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
