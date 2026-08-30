"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export const OfficialVoiceGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border-t border-border/60 pt-6">
      {/* Editorial Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-2 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <div>
          <span className="text-[10px] font-bold font-display uppercase tracking-widest text-primary block">
            Reconnaissance et Qualite
          </span>
          <h3 className="text-sm sm:text-base font-bold font-display text-foreground tracking-tight">
            Comment devenir la Voix Officielle d'un mot dans le Dictionnaire ?
          </h3>
        </div>

        <div className="text-text-muted shrink-0 ml-4">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content — Flat, Air, Cardless */}
      {isOpen && (
        <div className="pt-6 pb-2 space-y-6 animate-in fade-in duration-200">
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-3xl">
            Sur Corafric, chaque mot du dictionnaire est porte par un locuteur reel. Les voix de reference sont validees par la communaute grace a un protocole d'ecoute a l'aveugle.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 border-t border-border/40">
            {/* Step 1 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-primary block">01</span>
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-foreground">
                Enregistrement net
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Parlez dans une piece silencieuse en respectant les tons de la langue Ewe.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-primary block">02</span>
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-foreground">
                Ecoute a l'aveugle
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Trois locuteurs natifs evaluent la clarte et la prononciation du mot.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-primary block">03</span>
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-foreground">
                Moyenne d'excellence
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                L'enregistrement ayant la note la plus haute pour ce mot est selectionne.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-primary block">04</span>
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-foreground">
                Attribution du badge
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Votre nom apparait publiquement sur la fiche du mot dans le dictionnaire mondial.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
