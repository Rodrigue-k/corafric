"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ValidationCard } from "@/components/validation/ValidationCard";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ValidationRecording {
  id: string;
  audioUrl: string;
  sentence: {
    text: string;
    language: string;
  };
}

export default function ValidateClientPage() {
  const t = useTranslations("validate");
  const [recording, setRecording] = useState<ValidationRecording | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);

  const fetchNextRecording = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await fetch("/api/recordings/next");
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setRecording(data.recording);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch("/api/recordings/next");
        const data = await res.json();
        if (!ignore) {
          if (data.error) throw new Error(data.error);
          setRecording(data.recording);
        }
      } catch (err: unknown) {
        if (!ignore) setErrorMessage(err instanceof Error ? err.message : "Erreur de chargement.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  const handleVoteSubmitted = () => {
    setSessionCount((prev) => prev + 1);
    void fetchNextRecording();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-primary block">
            Contrôle Qualité
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            {t("instruction")}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-display uppercase tracking-widest text-text-muted/70 block">
            Session active
          </span>
          <span className="text-sm font-display font-semibold text-foreground">
            {sessionCount} vérifié{sessionCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Main Validation Viewport Area */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[260px] gap-3 border-y border-border/40 py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-text-muted font-display uppercase tracking-wider">Chargement de l'audio...</p>
          </div>
        ) : errorMessage ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-4 border-y border-border/40">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">{errorMessage}</p>
            <Button onClick={fetchNextRecording} variant="secondary" size="sm" className="rounded-full">
              Réessayer
            </Button>
          </div>
        ) : recording ? (
          <ValidationCard
            recording={recording}
            onVoteSubmitted={handleVoteSubmitted}
          />
        ) : (
          <div className="max-w-lg mx-auto py-20 text-center space-y-4 border-y border-border/40">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
              Corpus vérifié
            </h3>
            <p className="text-xs sm:text-sm text-text-muted max-w-sm mx-auto">
              Tous les enregistrements en attente ont été validés pour le moment.
            </p>
            <div className="pt-2">
              <Button onClick={fetchNextRecording} variant="primary" size="md" className="rounded-full">
                Actualiser la file
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
