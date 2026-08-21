"use client";

import React from "react";

export type ContributionPillar = "dictionary" | "sentences";

interface PillarSelectionProps {
  onSelectPillar: (pillar: ContributionPillar) => void;
}

export const PillarSelection: React.FC<PillarSelectionProps> = ({ onSelectPillar }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground leading-tight">
          Mode de contribution
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-lg mx-auto leading-relaxed">
          Sélectionnez un format d'enregistrement pour commencer à enrichir le corpus vocal en langue Éwé.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="flex flex-col md:flex-row gap-0 border-y border-border/50">
        {/* Pillar 1: Dictionnaire Vocal */}
        <div
          onClick={() => onSelectPillar("dictionary")}
          className="group relative flex-1 p-8 sm:p-12 md:border-r border-border/50 hover:bg-[#EADCC9]/10 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                01
              </span>
              <span className="text-xs text-text-muted font-display tracking-widest uppercase">
                Mots
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-display text-foreground group-hover:text-primary transition-colors tracking-tight">
                Dictionnaire
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Enregistrez des termes isolés pour construire le socle lexical de l'IA.
              </p>
            </div>
          </div>

          <div className="mt-12 text-sm font-medium text-foreground group-hover:text-primary transition-colors font-display uppercase tracking-widest">
            Commencer
          </div>
        </div>

        {/* Pillar 2: Entraînement IA (Phrases) */}
        <div
          onClick={() => onSelectPillar("sentences")}
          className="group relative flex-1 p-8 sm:p-12 border-t md:border-t-0 border-border/50 hover:bg-[#EADCC9]/10 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                02
              </span>
              <span className="text-xs text-text-muted font-display tracking-widest uppercase">
                Phrases
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-display text-foreground group-hover:text-primary transition-colors tracking-tight">
                Corpus Textuel
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Lisez des phrases complètes pour modéliser la syntaxe et l'intonation.
              </p>
            </div>
          </div>

          <div className="mt-12 text-sm font-medium text-foreground group-hover:text-primary transition-colors font-display uppercase tracking-widest">
            Commencer
          </div>
        </div>
      </div>
    </div>
  );
};
