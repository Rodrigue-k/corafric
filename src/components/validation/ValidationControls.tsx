"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";

interface ValidationControlsProps {
  onVote: (isValid: boolean) => void;
  disabled?: boolean;
}

export const ValidationControls: React.FC<ValidationControlsProps> = ({
  onVote,
  disabled = false,
}) => {
  const t = useTranslations("validate");

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center w-full max-w-md mx-auto">
      {/* Reject button */}
      <button
        type="button"
        onClick={() => onVote(false)}
        disabled={disabled}
        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full border border-border hover:border-foreground/60 bg-transparent hover:bg-black/5 text-foreground transition-colors font-display font-medium text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <X className="w-4 h-4 text-text-muted" />
        <span>{t("invalid")}</span>
      </button>

      {/* Approve button */}
      <button
        type="button"
        onClick={() => onVote(true)}
        disabled={disabled}
        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors font-display font-semibold text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
      >
        <Check className="w-4 h-4" />
        <span>{t("valid")}</span>
      </button>
    </div>
  );
};
