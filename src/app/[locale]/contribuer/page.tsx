"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ContribuerPage() {
  const t = useTranslations("contribuer");
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const shareData = {
      title: "Corafric",
      text: t("hero.subtitle"),
      url: typeof window !== "undefined" ? window.location.origin : "https://corafric.com",
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F7F3EE] font-sans overflow-hidden">
      <Navbar />

      <main className="flex-grow relative flex items-center justify-center z-10 overflow-visible">
        {/* Background decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Left terracotta light shape */}
          <div className="absolute top-[10%] left-[-5%] w-[45vw] h-[80vh] bg-[#B84A2A] opacity-[0.04] rotate-[-12deg] rounded-[60px]" />
          {/* Right gold light shape behind the text */}
          <div className="absolute bottom-[5%] right-[-5%] w-[50vw] h-[80vh] bg-[#D4A017] opacity-[0.04] rotate-[8deg] rounded-[80px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full h-full flex items-center overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center w-full h-full lg:max-h-[85vh] overflow-visible">
            
            {/* Left Column (45%) - Hidden on Mobile */}
            <div className="hidden lg:flex lg:col-span-5 items-end justify-center h-full relative self-end overflow-visible select-none pointer-events-none z-20">
              <div className="relative w-full h-[70vh] max-h-[580px] flex items-end overflow-visible">
                <Image
                  src="/images/contribute-person.webp"
                  alt="Corafric Contributor"
                  width={450}
                  height={675}
                  unoptimized
                  className="object-contain w-auto h-full max-h-[540px] drop-shadow-2xl translate-y-8 scale-[1.18] origin-bottom duration-500"
                  priority
                />
              </div>
            </div>

            {/* Right Column (55%) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8 text-center lg:text-left py-8 lg:py-0 w-full z-10">
              {/* Eyebrow Tag */}
              <div>
                <span className="text-caption text-primary uppercase tracking-widest font-semibold text-xs sm:text-sm">
                  {t("hero.tag")}
                </span>
              </div>

              {/* Slogan */}
              <h1 className="text-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight whitespace-pre-line">
                {t("hero.title")}
              </h1>

              {/* Subtitle */}
              <p className="text-body text-text-muted text-sm sm:text-base max-w-xl mx-auto lg:mx-0 whitespace-pre-line leading-relaxed">
                {t("hero.subtitle")}
              </p>

              {/* Three simple actions list */}
              <div className="flex flex-col space-y-3 pt-2 max-w-xl mx-auto lg:mx-0 w-full">
                {/* Action 1 */}
                <div className="flex items-center justify-between py-3 border-b border-[#EADCC9]/40 hover:border-primary/50 transition-colors duration-200 group">
                  <span className="text-sm font-semibold text-text-muted">{t("ways.way1.text")}</span>
                  <Link
                    href="/contribute"
                    className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  >
                    <span>{t("ways.way1.action")}</span>
                  </Link>
                </div>

                {/* Action 2 */}
                <div className="flex items-center justify-between py-3 border-b border-[#EADCC9]/40 hover:border-primary/50 transition-colors duration-200 group">
                  <span className="text-sm font-semibold text-text-muted">{t("ways.way2.text")}</span>
                  <a
                    href="https://github.com/Rodrigue-k/corafric"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  >
                    <span>{t("ways.way2.action")}</span>
                  </a>
                </div>

                {/* Action 3 */}
                <div className="flex items-center justify-between py-3 border-b border-[#EADCC9]/40 hover:border-primary/50 transition-colors duration-200 group relative">
                  <span className="text-sm font-semibold text-text-muted">{t("ways.way3.text")}</span>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center text-sm font-semibold text-primary hover:underline focus:outline-none"
                  >
                    <span>{t("ways.way3.action")}</span>
                  </button>

                  {/* Toast/Tooltip for Clipboard copy feedback */}
                  {copied && (
                    <div className="absolute right-0 -top-8 bg-foreground text-background text-xs font-semibold px-2 py-1 rounded shadow-md animate-fade-in-down">
                      Lien copié !
                    </div>
                  )}
                </div>
              </div>

              {/* Fine gold gradient separator */}
              <div className="w-full max-w-xl mx-auto lg:mx-0 h-[1.5px] bg-gradient-to-r from-[#D4A017]/10 via-[#D4A017]/60 to-[#D4A017]/10" />

              {/* Partnership Contact */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 pt-1 text-sm text-text-muted">
                <span>{t("partnership.text")}</span>
                <a
                  href="mailto:contact@corafric.com?subject=Partenariat%20Corafric"
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>{t("partnership.cta")}</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
