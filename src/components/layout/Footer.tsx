import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export const Footer: React.FC = () => {
  const t = useTranslations("brandShowcase");

  return (
    <footer className="w-full bg-[#FAF8F5] border-t border-[#EADCC9]/60 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-text-muted text-xs">
        <p>
          &copy; {new Date().getFullYear()} {t("copyright")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link href="/contribute" className="hover:text-primary transition-colors duration-200">
            Contribuer
          </Link>
          <span className="text-text-muted/40">·</span>
          <Link href="/validate" className="hover:text-primary transition-colors duration-200">
            Valider
          </Link>
          <span className="text-text-muted/40">·</span>
          <Link href="/dictionary" className="hover:text-primary transition-colors duration-200">
            Dictionnaire
          </Link>
          <span className="text-text-muted/40">·</span>
          <Link href="/leaderboard" className="hover:text-primary transition-colors duration-200">
            Classement
          </Link>
          <span className="text-text-muted/40">·</span>
          <Link href="/profile" className="hover:text-primary transition-colors duration-200">
            Profil
          </Link>
          <span className="text-text-muted/40">·</span>
          <Link href="/explore" className="hover:text-primary transition-colors duration-200">
            Dataset
          </Link>

          <span className="text-text-muted/40">·</span>
          <Link href="/privacy" className="hover:text-primary transition-colors duration-200">
            {t("privacy")}
          </Link>
          <span className="text-text-muted/40">·</span>
          <Link href="/cookies" className="hover:text-primary transition-colors duration-200">
            {t("cookies")}
          </Link>
        </div>
      </div>
    </footer>
  );
};
