"use client";

import React, { useState } from "react";
import { Mic, Volume2, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";

interface RecordingChecklistProps {
  onReady: () => void;
}

const CHECKLIST_ITEMS = [
  {
    id: "quiet",
    icon: MapPin,
    label: "Je suis dans un endroit calme",
    description: "Pas de musique, pas de rue bruyante, pas de ventilateur à côté.",
  },
  {
    id: "distance",
    icon: Mic,
    label: "Mon micro est bien positionné",
    description: "À 10–15 cm de ma bouche, pas dans ma poche ou à l'autre bout de la pièce.",
  },
  {
    id: "volume",
    icon: Volume2,
    label: "Mon volume est correct",
    description: "Je vais parler d'une voix claire et normale, ni trop fort ni trop bas.",
  },
];

export const RecordingChecklist: React.FC<RecordingChecklistProps> = ({ onReady }) => {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    quiet: false,
    distance: false,
    volume: false,
  });

  const allChecked = Object.values(checked).every(Boolean);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-[10px] font-bold font-display uppercase tracking-widest text-primary/70 block">
          Avant de commencer
        </span>
        <h2 className="text-xl font-display font-bold text-foreground tracking-tight">
          Vérification de l&apos;environnement
        </h2>
        <p className="text-xs text-text-muted">
          Cochez les 3 points pour garantir un audio de qualité.
          Un mauvais audio sera rejeté automatiquement.
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {CHECKLIST_ITEMS.map(({ id, icon: Icon, label, description }) => {
          const isChecked = checked[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isChecked
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-foreground/30 bg-transparent"
              }`}
            >
              {/* Checkbox visual */}
              <div
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isChecked
                    ? "border-primary bg-primary"
                    : "border-border/60 bg-transparent"
                }`}
              >
                {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>

              {/* Icon + Text */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Icon
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${
                    isChecked ? "text-primary" : "text-text-muted"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold font-display transition-colors ${
                      isChecked ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="pt-2">
        <Button
          onClick={onReady}
          disabled={!allChecked}
          variant="primary"
          size="lg"
          className="w-full"
        >
          <Mic className="w-4 h-4 mr-2" />
          {allChecked ? "Je suis prêt(e) — Commencer" : `Cochez les ${Object.values(checked).filter(Boolean).length}/3 points`}
        </Button>
        {!allChecked && (
          <p className="text-center text-[10px] text-text-muted mt-2">
            Ces conditions garantissent la qualité de votre contribution.
          </p>
        )}
      </div>
    </div>
  );
};
