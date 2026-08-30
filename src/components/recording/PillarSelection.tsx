"use client";

import React from "react";
import { OfficialVoiceGuide } from "./OfficialVoiceGuide";

export type ContributionPillar = "dictionary" | "sentences";

interface PillarSelectionProps {
  onSelectPillar: (pillar: ContributionPillar) => void;
}

export const PillarSelection: React.FC<PillarSelectionProps> = ({ onSelectPillar }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <span className="text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-primary block">
          Enrichir le corpus
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground leading-tight tracking-tight">
          Mode de contribution
        </h1>
        <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
          Sélectionnez un format d'enregistrement pour enrichir le corpus vocal en langue Éwé.
        </p>
      </div>

      {/* Editorial Pillars Split — Flat, Cardless, Border-Structured */}
      <div className="flex flex-col md:flex-row border-y border-border/60">
        {/* Pillar 1: Dictionnaire Vocal */}
        <div
          onClick={() => onSelectPillar("dictionary")}
          className="group flex-1 p-8 sm:p-12 md:border-r border-b md:border-b-0 border-border/60 hover:bg-[#EADCC9]/15 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-primary/70">
                01
              </span>
              <span className="text-xs font-display tracking-widest uppercase text-text-muted">
                Mots isolés
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                Dictionnaire Vocal
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Enregistrez des termes individuels avec leur définition pour fixer la prononciation et les variations tonales.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t border-border/40 text-xs font-semibold text-foreground group-hover:text-primary transition-colors font-display uppercase tracking-widest">
            Commencer le dictionnaire
          </div>
        </div>

        {/* Pillar 2: Corpus Textuel */}
        <div
          onClick={() => onSelectPillar("sentences")}
          className="group flex-1 p-8 sm:p-12 hover:bg-[#EADCC9]/15 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-primary/70">
                02
              </span>
              <span className="text-xs font-display tracking-widest uppercase text-text-muted">
                Phrases complètes
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                Corpus Textuel
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Lisez des phrases entières dans leur contexte pour modéliser la syntaxe, la prosodie et le rythme naturel.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t border-border/40 text-xs font-semibold text-foreground group-hover:text-primary transition-colors font-display uppercase tracking-widest">
            Commencer les phrases
          </div>
        </div>
      </div>

      {/* Educational Guide for Contributors: Official Voice Program */}
      <OfficialVoiceGuide />
    </div>
  );
};
