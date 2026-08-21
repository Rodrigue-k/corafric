"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ValidationCard } from "@/components/validation/ValidationCard";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

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
    <div className="mx-auto max-w-4xl space-y-16 py-12">
      {/* Header section with session counter */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-border/50 pb-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted">
            {t("instruction")}
          </p>
        </div>

        {/* Session Stats */}
        <div className="text-right">
          <p className="text-[10px] font-display uppercase tracking-widest text-text-muted/60">Session</p>
          <p className="text-lg font-display tracking-widest text-foreground font-medium">
            {t("sessionCount", { count: sessionCount })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border-y border-border/50">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : errorMessage ? (
        <div className="max-w-xl mx-auto py-20 text-center space-y-4 border-y border-border/50">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-red-600">{errorMessage}</p>
          <Button onClick={fetchNextRecording} variant="secondary" className="mt-4 border-border text-xs uppercase tracking-widest font-display">
            Réessayer
          </Button>
        </div>
      ) : recording ? (
        <ValidationCard recording={recording} onVoteSubmitted={handleVoteSubmitted} />
      ) : (
        <div className="max-w-xl mx-auto py-32 text-center space-y-6 border-y border-border/50">
          <h3 className="text-3xl font-display font-bold tracking-tight">Corpus vérifié.</h3>
          <p className="text-sm text-text-muted">
            Aucun enregistrement en attente.
          </p>
          <div className="pt-4">
            <Button onClick={fetchNextRecording} variant="primary" className="text-xs uppercase tracking-widest font-display">
              Actualiser
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
