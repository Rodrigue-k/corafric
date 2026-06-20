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
        <section className="relative overflow-x-hidden overflow-y-visible min-h-[calc(100vh-4rem)] flex items-center pt-24 pb-28 lg:pt-28 lg:pb-36">
          {/* Background SVG Shapes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1440 800" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="950" y="-150" width="600" height="500" rx="40" fill="#C4522A" fillOpacity="0.35" transform="rotate(-12 1250 100)" />
            <rect x="1100" y="200" width="400" height="400" rx="30" fill="#D4A017" fillOpacity="0.25" transform="rotate(-8 1300 400)" />
            <circle cx="50" cy="750" r="250" fill="#C4522A" fillOpacity="0.20" />
          </svg>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 overflow-visible w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center overflow-visible">
              {/* Left Column info */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left relative z-10">
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
                  <Link href="/explore">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                      {t("ctaSecondary")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column image and floating components */}
              <div className="lg:col-span-6 relative flex justify-center items-center overflow-visible h-[500px] lg:h-[580px] w-full">
                <div className="absolute w-[80%] h-[80%] bg-primary/5 rounded-full filter blur-3xl -z-10" />

                <div className="relative w-full max-w-[480px] h-full overflow-visible">
                  <div className="absolute inset-0 z-10 transform hover:scale-[1.02] transition-transform duration-500 ease-out overflow-visible" style={{ marginTop: "-50px", height: "calc(100% + 50px)" }}>
                    <Image
                      src="/images/hero-person.webp"
                      alt="Jeune Africain enregistrant sa voix"
                      fill
                      priority
                      className="object-contain object-bottom overflow-visible"
                    />
                  </div>

                  {/* Floating Card 1 */}
                  <div className="absolute -left-4 top-[20%] z-20 animate-bounce [animation-duration:5s] hover:scale-105 transition-transform duration-200">
                    <Card className="p-4 shadow-xl border-primary/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-label text-text-muted">{t("stats.recordings")}</p>
                        <p className="text-h3 font-bold text-primary">{mounted ? stats.totalRecordings.toLocaleString() : "1248"}</p>
                      </div>
                    </Card>
                  </div>

                  {/* Floating Card 2 */}
                  <div className="absolute right-0 bottom-[15%] z-20 animate-pulse hover:scale-105 transition-transform duration-200">
                    <Card className="p-4 shadow-xl border-accent/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-label text-text-muted">Langue</p>
                        <p className="text-h3 font-bold text-foreground">Ewe (ɛʋɛgbɛ)</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Angular Transition Shape */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 transform translate-y-[1px]">
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="relative block w-full h-[80px]">
              <polygon points="0,0 1440,0 1440,80 720,20 0,80" fill="#F7F3EE" />
            </svg>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="bg-primary-tint/30 py-16 border-y border-border">
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
