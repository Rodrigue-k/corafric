import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { BrandShowcase } from "@/components/sections/BrandShowcase";
import { Button } from "@/components/ui/Button";
import { AfricaMap } from "@/components/ui/AfricaMap";
import { LiveStats } from "@/components/sections/LiveStats";
import { VoiceBubble } from "@/components/ui/VoiceBubble";

/**
 * Unified Voice Bubbles Array — Mathematically Solid Architecture.
 * Instead of separate "mobile" and "desktop" layouts (which the user rightly called "bricolage"),
 * we define ONE single source of truth for the coordinates based on the image's intrinsic proportions.
 * The bubbles are placed using the exact percentages that look perfect on the PC version.
 * As the screen shrinks, the wrapper shrinks proportionally, and the `scale-[...]` classes
 * guarantee that the bubbles themselves also shrink in exact proportion, maintaining the exact
 * same visual layout across ALL devices without any disjointed breakpoints.
 */
const VOICE_BUBBLES = [
  { id: "tl", phrase: "Woezɔ loo", className: "absolute top-[22%] left-[18%] z-20 scale-[0.65] sm:scale-[0.8] lg:scale-100 origin-bottom-left" },
  { id: "ml", phrase: "Akpe kaka", className: "absolute top-[42%] left-[14%] z-20 scale-[0.65] sm:scale-[0.8] lg:scale-100 origin-bottom-left" },
  { id: "tr", phrase: "Ndi na mi", className: "absolute top-[26%] right-[16%] z-20 scale-[0.65] sm:scale-[0.8] lg:scale-100 origin-bottom-right" },
  { id: "mr", phrase: "Mia dogo",  className: "absolute top-[48%] right-[10%] z-20 scale-[0.65] sm:scale-[0.8] lg:scale-100 origin-bottom-right" },
];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#F7F3EE] min-h-[100dvh] lg:h-[100dvh] flex items-center pt-20 lg:pt-0">
        
        {/* Subtle Ambient Atmosphere & Precision Acoustic Grid */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Diffused warm ambient glows */}
          <div className="absolute right-[5%] bottom-[15%] w-[480px] h-[480px] bg-primary/[0.12] rounded-full blur-[100px]" />
          <div className="absolute right-[25%] top-[20%] w-[360px] h-[360px] bg-[#D4A017]/[0.08] rounded-full blur-[90px]" />

          {/* Delicate architectural acoustic wave lines */}
          <svg
            className="absolute right-0 top-0 bottom-0 h-full w-full lg:w-[55vw] opacity-30"
            viewBox="0 0 700 800"
            fill="none"
            preserveAspectRatio="xMaxYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 800C180 620 260 460 380 340C500 220 620 140 700 100"
              stroke="#C4522A"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.35"
            />
            <path
              d="M180 800C260 640 340 500 450 380C560 260 640 180 700 140"
              stroke="#C4522A"
              strokeWidth="1.2"
              opacity="0.25"
            />
            <path
              d="M260 800C340 660 420 530 520 420C620 310 670 230 700 180"
              stroke="#D4A017"
              strokeWidth="1"
              strokeDasharray="3 5"
              opacity="0.25"
            />
          </svg>
        </div>

        {/* Hero Content Area */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full h-full flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Value proposition */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left py-8 lg:py-0">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground leading-[1.15] tracking-tight">
                {t("title")}
              </h1>
              <p className="text-base sm:text-lg text-text-muted max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {t("subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 pt-2">
                <Link href="/contribute">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md shadow-primary/20">
                    {t("ctaPrimary")}
                  </Button>
                </Link>
                <Link href="/dictionary">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    {t("ctaSecondary")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column Spacer on Desktop */}
            <div className="lg:col-span-6 h-[320px] sm:h-[420px] lg:h-[540px] pointer-events-none" />
          </div>
        </div>

        {/* Speaker Cutout with Proportional Voice Bubble Constellation */}
        <div className="absolute bottom-0 right-0 lg:right-[4%] w-full max-w-[420px] sm:max-w-[500px] lg:max-w-[620px] z-10 pointer-events-none flex items-end justify-center lg:justify-end overflow-visible">
          {/* This wrapper scales up/down and keeps its intrinsic aspect ratio perfectly locked */}
          <div className="relative w-full h-auto transform scale-[1.08] lg:scale-[1.14] origin-bottom translate-y-[8px]">
            <Image
              src="/images/hero-person.webp"
              alt="Locuteur africain enregistrant sa voix"
              width={620}
              height={800}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 620px"
              className="w-full h-auto object-bottom select-none"
            />

            {/* Unified bubbles rendered inside the exact same scaling context as the image */}
            <div className="absolute inset-0">
              {VOICE_BUBBLES.map((bubble) => (
                <VoiceBubble
                  key={bubble.id}
                  phrase={bubble.phrase}
                  className={bubble.className}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Seamless Soundwave Transition Edge */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 pointer-events-none translate-y-[1px]">
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            className="relative block w-full h-[25px] sm:h-[40px] lg:h-[60px]"
          >
            <polygon
              points="0,60 0,35 120,50 240,25 360,45 480,20 600,52 720,28 840,55 960,18 1080,42 1200,20 1320,50 1440,30 1440,60"
              fill="#FAF8F5"
            />
          </svg>
        </div>
      </section>

      {/* STATS SECTION */}
      <LiveStats />

      {/* HOW IT WORKS / TWO PILLARS SECTION - Editorial Split, Zero Cards */}
      <section className="relative py-20 bg-white border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
              Méthodologie
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              {t("how.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {/* Pillar 1 */}
            <div className="py-8 md:py-0 md:px-8 first:pl-0 last:pr-0 space-y-4">
              <span className="text-xs font-mono font-bold text-primary block">
                01
              </span>
              <h3 className="text-xl font-bold font-display text-foreground">
                {t("how.step1Title")}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t("how.step1Desc")}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="py-8 md:py-0 md:px-8 first:pl-0 last:pr-0 space-y-4">
              <span className="text-xs font-mono font-bold text-primary block">
                02
              </span>
              <h3 className="text-xl font-bold font-display text-foreground">
                {t("how.step2Title")}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t("how.step2Desc")}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="py-8 md:py-0 md:px-8 first:pl-0 last:pr-0 space-y-4">
              <span className="text-xs font-mono font-bold text-primary block">
                03
              </span>
              <h3 className="text-xl font-bold font-display text-foreground">
                {t("how.step3Title")}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t("how.step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETS MAP SECTION */}
      <section className="relative py-16 sm:py-20 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column Text */}
            <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
                {t("markets.label")}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-foreground leading-tight">
                {t("markets.title")}
              </h2>
              <p className="text-sm text-text-muted max-w-md mx-auto lg:mx-0 leading-relaxed">
                {t("markets.subtitle")}
              </p>
            </div>

            {/* Right Column Map */}
            <div className="lg:col-span-7 flex justify-center items-center w-full max-w-[650px] mx-auto">
              <AfricaMap className="w-full h-auto max-h-[480px] text-[#C4B8A8]" />
            </div>
          </div>
        </div>
      </section>

      <BrandShowcase />
    </div>
  );
}
