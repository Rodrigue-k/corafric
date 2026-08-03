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
        className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-600 font-semibold"
        disabled={disabled}
      >
        ✗ {t("invalid")}
      </Button>

      <Button
        onClick={() => onVote(true)}
        variant="primary"
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white focus:ring-green-600 shadow-lg shadow-green-600/10 font-semibold"
        disabled={disabled}
      >
        ✓ {t("valid")}
      </Button>
    </div>
  );
};
