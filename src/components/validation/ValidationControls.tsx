import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/Button";

interface ValidationControlsProps {
  onVote: (isValid: boolean) => void;
  disabled?: boolean;
}

export const ValidationControls: React.FC<ValidationControlsProps> = ({ onVote, disabled = false }) => {
  const t = useTranslations("validate");

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
      <Button
        onClick={() => onVote(false)}
        variant="secondary"
        className="w-full sm:w-auto border-border text-foreground hover:bg-border/20 font-display uppercase tracking-widest text-xs"
        disabled={disabled}
      >
        ✗ {t("invalid")}
      </Button>

      <Button
        onClick={() => onVote(true)}
        variant="primary"
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-display uppercase tracking-widest text-xs"
        disabled={disabled}
      >
        ✓ {t("valid")}
      </Button>
    </div>
  );
};
