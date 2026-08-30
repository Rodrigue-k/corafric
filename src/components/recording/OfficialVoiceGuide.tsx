"use client";

import React, { useState } from "react";
import { Award, ShieldCheck, Sparkles, Volume2, ChevronDown, ChevronUp, Star, Users } from "lucide-react";

export const OfficialVoiceGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border border-border/80 rounded-2xl bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300 shadow-xs">
      {/* Header Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 sm:p-8 text-left hover:bg-black/[0.01] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold font-display uppercase tracking-widest text-primary block">
              Reconnaissance & Qualité
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-foreground tracking-tight">
              Comment devenir la Voix Officielle d&apos;un mot dans le Dictionnaire ?
            </h3>
          </div>
        </div>

        <div className="text-text-muted shrink-0 ml-4">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-border/40 space-y-6">
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Sur Corafric, chaque mot du dictionnaire est porté par un vrai locuteur. Les voix ne sont pas choisies au hasard : elles sont élues par la communauté grâce à un algorithme de notation par les pairs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-border/60 bg-[#FAF8F5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-primary">01</span>
                <Volume2 className="w-4 h-4 text-primary/70" />
              </div>
              <h4 className="text-sm font-bold font-display text-foreground">
                Enregistrement net
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Parlez à 10–15 cm du micro, dans une pièce silencieuse, en respectant les tons hauts et bas de l&apos;Éwé.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-border/60 bg-[#FAF8F5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-primary">02</span>
                <Users className="w-4 h-4 text-primary/70" />
              </div>
              <h4 className="text-sm font-bold font-display text-foreground">
                Écoute à l&apos;aveugle
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                3 locuteurs natifs écoutent anonymement votre audio sur la page de validation et attribuent de 1 à 5 étoiles.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-border/60 bg-[#FAF8F5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-primary">03</span>
                <Star className="w-4 h-4 text-primary/70" />
              </div>
              <h4 className="text-sm font-bold font-display text-foreground">
                Moyenne d&apos;excellence
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Un score moyen ≥ 3.5 valide l&apos;audio pour l&apos;entraînement IA. Le meilleur score pour un mot devient la référence.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl border border-border/60 bg-[#FAF8F5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-primary">04</span>
                <Sparkles className="w-4 h-4 text-primary/70" />
              </div>
              <h4 className="text-sm font-bold font-display text-foreground">
                Badge Voix Officielle
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Votre nom d&apos;utilisateur apparaît sur la fiche du mot dans le dictionnaire mondial : « Voix : @votre_nom ».
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-900 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              <strong>Règle de filtrage automatique :</strong> Les enregistrements inaudibles, saturés ou pollués par le bruit sont automatiquement rejetés par le serveur avant même la validation.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
