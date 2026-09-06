"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { OfficialVoiceGuide } from "./OfficialVoiceGuide";

export type ContributionPillar = "dictionary" | "sentences";

interface PillarSelectionProps {
  onSelectPillar: (pillar: ContributionPillar) => void;
}

export const PillarSelection: React.FC<PillarSelectionProps> = ({ onSelectPillar }) => {
  const t = useTranslations("contribute");

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <span className="text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-primary block">
          {t("enrichCorpus")}
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground leading-tight tracking-tight">
          {t("modeTitle")}
        </h1>
        <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
          {t("modeSubtitle")}
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
                {t("dictionaryPillarSubtitle")}
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                {t("dictionaryPillarTitle")}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                {t("dictionaryPillarDesc")}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t border-border/40 text-xs font-semibold text-foreground group-hover:text-primary transition-colors font-display uppercase tracking-widest">
            {t("dictionaryPillarCta")}
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
                {t("sentencesPillarSubtitle")}
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                {t("sentencesPillarTitle")}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                {t("sentencesPillarDesc")}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t border-border/40 text-xs font-semibold text-foreground group-hover:text-primary transition-colors font-display uppercase tracking-widest">
            {t("sentencesPillarCta")}
          </div>
        </div>
      </div>

      {/* Educational Guide for Contributors: Official Voice Program */}
      <OfficialVoiceGuide />
    </div>
  );
};
