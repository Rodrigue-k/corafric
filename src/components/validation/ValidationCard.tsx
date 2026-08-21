"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ValidationControls } from "./ValidationControls";
import { CustomAudioPlayer } from "../recording/CustomAudioPlayer";
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
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 max-w-2xl mx-auto py-8">
      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-border/50 pb-4">
        <span className="text-[10px] font-bold font-display uppercase tracking-widest text-primary/60">
          Enregistrement {recording.id.substring(0, 8)}
        </span>
        <span className="text-xs font-display tracking-widest uppercase text-text-muted">
          {recording.sentence.language || "Éwé"}
        </span>
      </div>

      {/* Text / Word Display */}
      <div className="space-y-4 py-8 text-center">
        <p className="text-5xl sm:text-6xl font-display font-bold text-foreground leading-tight tracking-tight">
          {recording.sentence.text}
        </p>
      </div>

      {/* Audio playback row */}
      <div className="w-full max-w-md mx-auto">
        <CustomAudioPlayer src={recording.audioUrl} />
      </div>

      {/* Interaction Controls */}
      <div className="pt-8 border-t border-border/50">
        {!voteSuccess ? (
          <ValidationControls onVote={handleVote} disabled={isSubmitting} />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-[#FAF8F5] rounded-xl border border-primary/20">
            <CheckCircle className="w-8 h-8 text-primary animate-bounce" />
            <p className="text-sm font-semibold text-primary">Vote enregistré !</p>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 mt-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
