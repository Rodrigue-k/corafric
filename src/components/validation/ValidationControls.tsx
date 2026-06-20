import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/Button";
import { Check, X } from "lucide-react";

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
        className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-600"
        disabled={disabled}
      >
        <X className="w-5 h-5 mr-2" />
        ✗ {t("invalid")}
      </Button>

      <Button
        onClick={() => onVote(true)}
        variant="primary"
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white focus:ring-green-600 shadow-lg shadow-green-600/10"
        disabled={disabled}
      >
        <Check className="w-5 h-5 mr-2" />
        ✓ {t("valid")}
      </Button>
    </div>
  );
};
