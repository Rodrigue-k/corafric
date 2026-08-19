"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { PioneerBadge } from "./PioneerBadge";

export type ContributionPillar = "dictionary" | "sentences";

interface PillarSelectionProps {
  onSelectPillar: (pillar: ContributionPillar) => void;
}

export const PillarSelection: React.FC<PillarSelectionProps> = ({ onSelectPillar }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <PioneerBadge />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground leading-tight">
          Mode de contribution
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-lg mx-auto leading-relaxed">
          Sélectionnez un format d'enregistrement pour commencer à enrichir le corpus vocal en langue Éwé.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Dictionnaire Vocal */}
        <div
          onClick={() => onSelectPillar("dictionary")}
          className="group relative p-8 rounded-2xl bg-white border border-border hover:border-primary/60 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Option 01
              </span>
              <span className="text-xs text-text-muted font-medium bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-border/60">
                Mots isolés
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
                Dictionnaire Vocal
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Enregistrez des termes individuels avec leur traduction et définition affichées à l'écran pour garantir une prononciation et une intonation fidèles.
              </p>
            </div>

            <div className="space-y-2 text-xs text-text-muted border-t border-border/60 pt-4">
              <div className="flex items-center justify-between">
                <span>Durée moyenne</span>
                <span className="font-medium text-foreground">~2 secondes / mot</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Support visuel</span>
                <span className="font-medium text-foreground">Traduction FR + Définition</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-sm font-semibold text-primary">
            <span>Enregistrer des mots</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Pillar 2: Studio IA */}
        <div
          onClick={() => onSelectPillar("sentences")}
          className="group relative p-8 rounded-2xl bg-white border border-border hover:border-foreground/40 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Option 02
              </span>
              <span className="text-xs text-text-muted font-medium bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-border/60">
                Phrases continues
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
                Studio IA
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Lisez des phrases complètes issues d'un corpus de 174 000 entrées pour entraîner les modèles de reconnaissance et synthèse vocale en contexte naturel.
              </p>
            </div>

            <div className="space-y-2 text-xs text-text-muted border-t border-border/60 pt-4">
              <div className="flex items-center justify-between">
                <span>Corpus disponible</span>
                <span className="font-medium text-foreground">174 066 phrases</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Type de données</span>
                <span className="font-medium text-foreground">Parole continue</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            <span>Enregistrer des phrases</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
