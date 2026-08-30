"use client";

import React, { useState } from "react";
import { Mic, Volume2, MapPin, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";

interface RecordingChecklistProps {
  onReady: () => void;
  onBack?: () => void;
  formatLabel?: string;
}

const CHECKLIST_ITEMS = [
  {
    id: "quiet",
    icon: MapPin,
    label: "Je suis dans un endroit calme",
    description: "Pas de musique, pas de rue bruyante, pas de ventilateur ou climatiseur direct.",
  },
  {
    id: "distance",
    icon: Mic,
    label: "Mon micro est bien positionné",
    description: "À 10–15 cm de ma bouche, pour capter une voix nette sans saturation.",
  },
  {
    id: "volume",
    icon: Volume2,
    label: "Mon volume et articulation sont corrects",
    description: "Je vais parler d'une voix naturelle et claire, en respectant les tons.",
  },
];

export const RecordingChecklist: React.FC<RecordingChecklistProps> = ({ onReady, onBack, formatLabel }) => {
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
    <div className="w-full max-w-lg mx-auto space-y-6 py-4">
      {/* Top Header & Back Switch */}
      <div className="flex items-center justify-between gap-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-black/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Changer de format
          </button>
        ) : <div />}
        {formatLabel && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 font-display">
            {formatLabel}
          </span>
        )}
      </div>

      {/* Header Info */}
      <div className="text-center space-y-2 pt-2">
        <span className="text-[10px] font-bold font-display uppercase tracking-widest text-primary block">
          Étape préalable de qualité
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
          Vérification de l&apos;environnement
        </h2>
        <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto leading-relaxed">
          Pour garantir un dataset de référence et éviter le rejet automatique de vos audios, confirmez ces 3 points avant d&apos;accéder au studio.
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-3 pt-2">
        {CHECKLIST_ITEMS.map(({ id, icon: Icon, label, description }) => {
          const isChecked = checked[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isChecked
                  ? "border-primary/40 bg-primary/5 shadow-xs"
                  : "border-border hover:border-foreground/30 bg-white/50"
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
      <div className="pt-4">
        <Button
          onClick={onReady}
          disabled={!allChecked}
          variant="primary"
          size="lg"
          className="w-full shadow-md shadow-primary/10"
        >
          <Mic className="w-4 h-4 mr-2" />
          {allChecked ? "Je suis prêt(e) — Entrer dans le studio" : `Cochez les 3 points (${Object.values(checked).filter(Boolean).length}/3)`}
        </Button>
        <p className="text-center text-[10px] text-text-muted mt-2">
          Cette vérification est requise une seule fois au début de votre session d&apos;enregistrement.
        </p>
      </div>
    </div>
  );
};
