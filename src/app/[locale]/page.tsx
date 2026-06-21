"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Globe, Mic, Users } from "lucide-react";
import { GlobalStats } from "@/types";

export default function Home() {
  const t = useTranslations("landing");
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<GlobalStats>({
    totalRecordings: 1248,
    approvedRecordings: 980,
    totalUsers: 84,
    totalHours: 3.4,
    totalSentences: 150,
  });

  useEffect(() => {
    setMounted(true);
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching live stats:", err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden h-[100dvh] min-h-[700px] flex pt-20 lg:pt-24 bg-[#F7F3EE]">
          {/* Formes géométriques structurelles d'arrière-plan (grands blocs de mise en page) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Grand bloc oblique terracotta à droite pour cadrer le personnage */}
            <div className="absolute right-[-15%] top-[-20%] w-[70vw] lg:w-[55vw] h-[140%] bg-[#C4522A] opacity-[0.9] rotate-[-12deg] origin-top-right rounded-[80px]" />
            {/* Accent oblique or en bas à gauche pour équilibrer la composition */}
            <div className="absolute left-[-15%] bottom-[-20%] w-[50vw] lg:w-[40vw] h-[60%] bg-[#D4A017] opacity-[0.25] rotate-[15deg] origin-bottom-left rounded-[60px]" />
          </div>


          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 overflow-visible w-full h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-full">
              {/* Left Column info */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6 text-center lg:text-left relative z-10 pb-10 lg:pb-20">
                <h1 className="text-display text-foreground leading-tight whitespace-pre-line">
                  {t("title")}
                </h1>
                <p className="text-body text-text-muted max-w-lg mx-auto lg:mx-0">
                  {t("subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                  <Link href="/contribute">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20">
                      {t("ctaPrimary")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column image and floating components */}
              <div className="lg:col-span-6 relative flex justify-center items-end h-full w-full">
                <div className="relative w-full max-w-[650px] h-[75%] lg:h-[85%]">
                  <Image
                    src="/images/hero-person.webp"
                    alt="Jeune Africain enregistrant sa voix"
                    width={800}
                    height={1000}
                    priority
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[115%] lg:h-[125%] w-auto max-w-none object-contain object-bottom z-10 transform hover:scale-[1.02] transition-transform duration-500 ease-out origin-bottom"
                  />


                </div>
              </div>
            </div>
          </div>

          {/* Transition sous forme d'onde sonore (Soundwave Transition) unique à l'identité audio de Corafric */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 transform translate-y-[1px]">
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="relative block w-full h-[80px]">
              <polygon points="0,80 0,45 120,65 240,30 360,60 480,25 600,70 720,35 840,70 960,20 1080,55 1200,25 1320,65 1440,40 1440,80" fill="#FDF0EB" />
            </svg>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="bg-primary-tint py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-display text-[#1A1A2E] font-bold mb-1">
                  {mounted ? stats.totalRecordings.toLocaleString() : "0"}
                </p>
                <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
                  {t("stats.recordings")}
                </p>
              </div>
              <div>
                <p className="text-display text-[#1A1A2E] font-bold mb-1">
                  {mounted ? stats.totalUsers.toLocaleString() : "0"}
                </p>
                <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
                  {t("stats.speakers")}
                </p>
              </div>
              <div>
                <p className="text-display text-[#1A1A2E] font-bold mb-1">
                  {mounted ? (stats.totalHours || 0).toLocaleString() : "0"}h
                </p>
                <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
                  {t("stats.hours")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-5 -z-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" className="text-text-muted" />
            </svg>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-h1 text-foreground mb-4">{t("how.title")}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative p-6 flex flex-col justify-between">
                <div>
                  <span className="text-primary/30 select-none block mb-4 font-extrabold text-[80px] leading-none font-display">
                    01
                  </span>
                  <h3 className="text-h2 text-foreground mb-2">{t("how.step1Title")}</h3>
                  <p className="text-body text-text-muted">
                    {t("how.step1Desc")}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative p-6 flex flex-col justify-between">
                <div>
                  <span className="text-primary/30 select-none block mb-4 font-extrabold text-[80px] leading-none font-display">
                    02
                  </span>
                  <h3 className="text-h2 text-foreground mb-2">{t("how.step2Title")}</h3>
                  <p className="text-body text-text-muted">
                    {t("how.step2Desc")}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative p-6 flex flex-col justify-between">
                <div>
                  <span className="text-primary/30 select-none block mb-4 font-extrabold text-[80px] leading-none font-display">
                    03
                  </span>
                  <h3 className="text-h2 text-foreground mb-2">{t("how.step3Title")}</h3>
                  <p className="text-body text-text-muted">
                    {t("how.step3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
