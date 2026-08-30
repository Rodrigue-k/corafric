"use client";

import React, { useState } from "react";
import { X, Check, Languages, Sparkles } from "lucide-react";

interface SuggestTranslationModalProps {
  wordId: string;
  wordEwe: string;
  currentFr?: string | null;
  currentEn?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SuggestTranslationModal: React.FC<SuggestTranslationModalProps> = ({
  wordId,
  wordEwe,
  currentFr,
  currentEn,
  onClose,
  onSuccess,
}) => {
  const [suggestedFr, setSuggestedFr] = useState(currentFr || "");
  const [suggestedEn, setSuggestedEn] = useState(currentEn || "");
  const [suggestedDef, setSuggestedDef] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedFr.trim() && !suggestedEn.trim() && !suggestedDef.trim()) {
      setError("Veuillez renseigner au moins une traduction ou définition.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/dictionary/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId,
          suggestedFr: suggestedFr.trim(),
          suggestedEn: suggestedEn.trim(),
          suggestedDef: suggestedDef.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement de la proposition.");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-border max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-text-muted hover:text-foreground hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <span className="text-primary font-display font-bold text-[10px] uppercase tracking-widest block">
            Contribution Lexicale
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground">
            Corriger ou enrichir « {wordEwe} »
          </h2>
          <p className="text-xs text-text-muted">
            Proposez une traduction precise pour perfectionner le dictionnaire.
          </p>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground">Merci pour votre proposition</h3>
            <p className="text-xs text-text-muted">La traduction a ete enregistree avec succes.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-display uppercase tracking-wider text-text-muted mb-1">
                Traduction en Francais *
              </label>
              <input
                type="text"
                value={suggestedFr}
                onChange={(e) => setSuggestedFr(e.target.value)}
                placeholder="Ex: homme, manger, bonne nuit..."
                className="w-full px-4 py-2 bg-transparent border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-display uppercase tracking-wider text-text-muted mb-1">
                Traduction en Anglais (Optionnel)
              </label>
              <input
                type="text"
                value={suggestedEn}
                onChange={(e) => setSuggestedEn(e.target.value)}
                placeholder="Ex: man, eat, good night..."
                className="w-full px-4 py-2 bg-transparent border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-display uppercase tracking-wider text-text-muted mb-1">
                Definition ou Nuance (Optionnel)
              </label>
              <textarea
                value={suggestedDef}
                onChange={(e) => setSuggestedDef(e.target.value)}
                placeholder="Sens exact ou contexte d'utilisation..."
                rows={2}
                className="w-full px-4 py-2 bg-transparent border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border text-xs font-bold font-display uppercase tracking-wider text-text-muted hover:bg-black/5 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-bold font-display uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Envoi..." : "Soumettre la traduction"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
