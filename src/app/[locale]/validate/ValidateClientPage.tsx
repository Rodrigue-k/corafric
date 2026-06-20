"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ValidationCard } from "@/components/validation/ValidationCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Headphones, Sparkles, AlertCircle } from "lucide-react";

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
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de chargement.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNextRecording();
  }, []);

  const handleVoteSubmitted = (status: string) => {
    setSessionCount((prev) => prev + 1);
    fetchNextRecording();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header section with session counter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-6">
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-h1 text-foreground font-display flex items-center justify-center md:justify-start gap-2">
            <Headphones className="w-8 h-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-body text-text-muted">
            {t("instruction")}
          </p>
        </div>

        {/* Session Stats badge */}
        <div className="bg-primary-tint border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <p className="text-[10px] uppercase font-semibold text-text-muted">Session</p>
            <p className="text-sm font-bold text-primary">
              {t("sessionCount", { count: sessionCount })}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-body text-text-muted">Chargement...</p>
        </div>
      ) : errorMessage ? (
        <Card className="max-w-xl mx-auto p-8 border-red-200 bg-red-50/50 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-h3 font-semibold text-red-800">Erreur</h3>
          <p className="text-body text-red-700">{errorMessage}</p>
          <Button onClick={fetchNextRecording} variant="primary">
            Réessayer
          </Button>
        </Card>
      ) : recording ? (
        <ValidationCard recording={recording} onVoteSubmitted={handleVoteSubmitted} />
      ) : (
        <Card className="max-w-xl mx-auto p-10 text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
          <h3 className="text-h1">Tout est propre !</h3>
          <p className="text-body text-text-muted">
            Aucun enregistrement en attente de validation.
          </p>
          <Button onClick={fetchNextRecording} variant="primary">
            Actualiser
          </Button>
        </Card>
      )}
    </div>
  );
}
