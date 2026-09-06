"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { X } from "lucide-react";

interface AnonymousGateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnonymousGateModal: React.FC<AnonymousGateModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("contribute");
  const tNav = useTranslations("nav");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <Card className="max-w-md w-full p-8 space-y-6 relative bg-white border border-border shadow-xl rounded-2xl animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-text-muted hover:text-foreground rounded-md hover:bg-black/5 transition-colors cursor-pointer"
          aria-label={tNav("close")}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
            {t("anonymousGateSaved")}
          </span>

          <h3 className="text-2xl font-bold font-display text-foreground leading-snug">
            {t("anonymousGateTitle")}
          </h3>

          <p className="text-sm text-text-muted leading-relaxed">
            {t("anonymousGateDesc")}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href="/sign-up" className="block w-full">
            <Button variant="primary" size="md" className="w-full justify-center">
              {t("createAccount")}
            </Button>
          </Link>

          <Link href="/sign-in" className="block w-full">
            <Button variant="outline" size="md" className="w-full justify-center">
              {t("signIn")}
            </Button>
          </Link>
        </div>

        <div className="text-center pt-1">
          <button
            onClick={onClose}
            className="text-xs text-text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {t("closeAndBrowse")}
          </button>
        </div>
      </Card>
    </div>
  );
};

