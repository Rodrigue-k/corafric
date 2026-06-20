"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ValidationControls } from "./ValidationControls";
import { Volume2, AlertCircle, CheckCircle } from "lucide-react";

interface ValidationRecording {
  id: string;
  audioUrl: string;
  sentence: {
    text: string;
    language: string;
  };
}

interface ValidationCardProps {
  recording: ValidationRecording;
  onVoteSubmitted: (status: string) => void;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({ recording, onVoteSubmitted }) => {
  const t = useTranslations("validate");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<boolean>(false);

  const handleVote = async (isValid: boolean) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/validations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingId: recording.id,
          isValid,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setVoteSuccess(true);

      setTimeout(() => {
        setVoteSuccess(false);
        onVoteSubmitted(data.status);
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-8 max-w-xl mx-auto space-y-8 relative overflow-hidden">
      {/* Visual background decor */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />

      {/* Language badge */}
      <div className="flex justify-between items-center">
        <Badge variant="default" className="text-[10px]">
          Langue : Ewe ({recording.sentence.language})
        </Badge>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Volume2 className="w-4 h-4 text-primary" />
          <span>{t("play")}</span>
        </div>
      </div>

      {/* Sentence Display */}
      <div className="space-y-2 py-4">
        <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
          Texte :
        </p>
        <p className="text-h2 font-display text-foreground leading-relaxed">
          {recording.sentence.text}
        </p>
      </div>

      {/* Audio playback row */}
      <div className="py-6 px-4 bg-primary-tint/25 border border-primary/10 rounded-xl flex items-center justify-center">
        <audio
          src={recording.audioUrl}
          controls
          className="w-full max-w-[360px] focus:outline-none"
          autoPlay={false}
        />
      </div>

      {/* Interaction Controls */}
      {!voteSuccess ? (
        <ValidationControls onVote={handleVote} disabled={isSubmitting} />
      ) : (
        <div className="text-center py-2 text-green-600 font-medium flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5 animate-bounce" />
          <span>Succès !</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </Card>
  );
};
