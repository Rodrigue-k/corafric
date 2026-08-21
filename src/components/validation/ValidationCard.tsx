"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ValidationControls } from "./ValidationControls";
import { CustomAudioPlayer } from "../recording/CustomAudioPlayer";
import { AlertCircle, CheckCircle } from "lucide-react";

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

export const ValidationCard: React.FC<ValidationCardProps> = ({
  recording,
  onVoteSubmitted,
}) => {
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
      }, 500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-10 py-4">
      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-border/50 pb-3">
        <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-primary/70">
          Enregistrement #{recording.id.substring(0, 8)}
        </span>
        <span className="text-xs font-display tracking-widest uppercase text-text-muted">
          {recording.sentence.language || "Éwé"}
        </span>
      </div>

      {/* Main Focus: The text to validate */}
      <div className="text-center py-6 sm:py-8 space-y-3">
        <p className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight tracking-tight">
          « {recording.sentence.text} »
        </p>
      </div>

      {/* Solid Custom Audio Player */}
      <div className="w-full">
        <CustomAudioPlayer src={recording.audioUrl} />
      </div>

      {/* Validation Controls */}
      <div className="pt-6 border-t border-border/50">
        {!voteSuccess ? (
          <ValidationControls onVote={handleVote} disabled={isSubmitting} />
        ) : (
          <div className="flex items-center justify-center gap-2.5 p-4 bg-[#FAF8F5] rounded-2xl border border-primary/20 max-w-md mx-auto">
            <CheckCircle className="w-5 h-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Vote enregistré ! Suivant...</p>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 mt-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs sm:text-sm max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
