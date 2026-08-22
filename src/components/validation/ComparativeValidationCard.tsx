"use client";

import React, { useState } from "react";
import { Star, CheckCircle, AlertCircle } from "lucide-react";
import { CustomAudioPlayer } from "../recording/CustomAudioPlayer";
import { Button } from "../ui/Button";

interface ComparativeRecording {
  id: string;
  audioUrl: string;
  label: string; // "A", "B", "C"
  sentence: { text: string; language: string };
  word?: { text: string; translation?: string; definition?: string };
}

interface ComparativeValidationCardProps {
  recordings: ComparativeRecording[];
  onAllVotesSubmitted: () => void;
}

const SCORE_LABELS: Record<number, string> = {
  1: "Très mauvais",
  2: "Mauvais",
  3: "Correct",
  4: "Bon",
  5: "Excellent",
};

function StarRating({
  score,
  onChange,
  disabled,
}: {
  score: number;
  onChange: (s: number) => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || score;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(s)}
            aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
            className="transition-transform hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer p-0.5"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                s <= display
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-border"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-[10px] text-text-muted font-display uppercase tracking-wider h-3">
        {display > 0 ? SCORE_LABELS[display] : ""}
      </span>
    </div>
  );
}

export const ComparativeValidationCard: React.FC<ComparativeValidationCardProps> = ({
  recordings,
  onAllVotesSubmitted,
}) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayWord = recordings[0]?.word?.text || recordings[0]?.sentence?.text || "";
  const displayTranslation = recordings[0]?.word?.translation || null;
  const displayDefinition = recordings[0]?.word?.definition || null;

  const allScored = recordings.every((r) => (scores[r.id] ?? 0) > 0);

  const handleSubmit = async () => {
    if (!allScored || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await Promise.all(
        recordings.map((r) =>
          fetch("/api/validations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recordingId: r.id, score: scores[r.id] }),
          }).then((res) => res.json())
        )
      );

      setSubmitted(true);
      setTimeout(() => {
        onAllVotesSubmitted();
      }, 800);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-semibold font-display text-foreground">
          Notes soumises avec succès !
        </p>
        <p className="text-xs text-text-muted">Chargement du prochain groupe...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
        <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-primary/70">
          Mode Comparatif
        </span>
        <span className="text-[10px] font-display tracking-widest uppercase text-text-muted font-medium">
          {recordings[0]?.sentence?.language || "Éwé"} · {recordings.length} audios
        </span>
      </div>

      {/* Word */}
      <div className="text-center space-y-1 py-4">
        <p className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
          « {displayWord} »
        </p>
        {displayTranslation && (
          <p className="text-sm text-text-muted font-display italic">{displayTranslation}</p>
        )}
        {displayDefinition && (
          <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">{displayDefinition}</p>
        )}
      </div>

      {/* Recordings to rate */}
      <div className="space-y-4">
        {recordings.map((rec) => (
          <div
            key={rec.id}
            className={`border rounded-2xl p-4 space-y-3 transition-colors ${
              (scores[rec.id] ?? 0) > 0
                ? "border-primary/30 bg-primary/5"
                : "border-border"
            }`}
          >
            {/* Label + audio */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold font-display uppercase tracking-widest text-text-muted shrink-0">
                Audio {rec.label}
              </span>
              <div className="flex-1 min-w-0">
                <CustomAudioPlayer src={rec.audioUrl} />
              </div>
            </div>

            {/* Stars */}
            <div className="flex justify-center">
              <StarRating
                score={scores[rec.id] ?? 0}
                onChange={(s) => setScores((prev) => ({ ...prev, [rec.id]: s }))}
                disabled={isSubmitting}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <p className="text-center text-xs text-text-muted">
        {Object.values(scores).filter((s) => s > 0).length} / {recordings.length} audio
        {recordings.length > 1 ? "s" : ""} noté{recordings.length > 1 ? "s" : ""}
      </p>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!allScored || isSubmitting}
        variant="primary"
        size="lg"
        className="w-full rounded-full"
      >
        {isSubmitting ? "Envoi en cours..." : `Soumettre mes ${recordings.length} notes`}
      </Button>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};
