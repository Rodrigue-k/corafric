"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "../ui/Button";

interface ValidationControlsProps {
  onVote: (score: number) => void;
  disabled?: boolean;
}

const SCORE_LABELS: Record<number, string> = {
  1: "Très mauvais",
  2: "Mauvais",
  3: "Correct",
  4: "Bon",
  5: "Excellent",
};

export const ValidationControls: React.FC<ValidationControlsProps> = ({
  onVote,
  disabled = false,
}) => {
  const [hovered, setHovered] = useState<number>(0);
  const [selected, setSelected] = useState<number>(0);

  const displayScore = hovered || selected;

  const handleSubmit = () => {
    if (selected > 0 && !disabled) {
      onVote(selected);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Stars */}
      <div className="flex items-center gap-1.5" role="group" aria-label="Note de 1 à 5 étoiles">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(star)}
            aria-label={`${star} étoile${star > 1 ? "s" : ""} — ${SCORE_LABELS[star]}`}
            className="transition-transform hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer p-1"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= displayScore
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-border"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Label */}
      <p className="text-xs font-display uppercase tracking-widest text-text-muted h-4">
        {displayScore > 0 ? SCORE_LABELS[displayScore] : "Sélectionnez une note"}
      </p>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || selected === 0}
        variant="primary"
        size="md"
        className="w-full sm:w-auto px-8 rounded-full"
      >
        Valider la note
      </Button>
    </div>
  );
};
