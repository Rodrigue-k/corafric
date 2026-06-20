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
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
          {/* Background SVG Shapes */}
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-[0.06] pointer-events-none hidden md:block">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-primary">
              <polygon points="50,0 100,0 100,100 0,100" fill="currentColor" />
              <circle cx="80" cy="30" r="25" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="30" y1="100" x2="100" y2="30" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column info */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
                <Badge variant="default" className="px-4 py-1 text-xs">
                  {t("badge")}
                </Badge>
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
              <div className="lg:col-span-6 relative flex justify-center items-center">
                <div className="absolute w-[80%] h-[80%] bg-primary/5 rounded-full filter blur-3xl -z-10" />

                <div className="relative w-full max-w-[480px] h-[500px]">
                  <div className="absolute inset-0 z-10 transform hover:scale-[1.02] transition-transform duration-500 ease-out">
                    <Image
                      src="/images/hero-person.webp"
                      alt="Jeune Africain enregistrant sa voix"
                      fill
                      priority
                      className="object-contain"
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
        </section>

        {/* STATS SECTION */}
        <section className="bg-primary-tint/30 py-16 border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-display text-primary font-bold mb-1">
                  {stats.totalRecordings}
                </p>
                <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
                  {t("stats.recordings")}
                </p>
              </div>
              <div>
                <p className="text-display text-accent font-bold mb-1">
                  {stats.totalUsers}
                </p>
                <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
                  {t("stats.speakers")}
                </p>
              </div>
              <div>
                <p className="text-display text-foreground font-bold mb-1">
                  {stats.totalHours}h
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
                  <span className="text-display text-primary/10 select-none block mb-4 font-extrabold text-7xl leading-none">
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
                  <span className="text-display text-accent/10 select-none block mb-4 font-extrabold text-7xl leading-none">
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
                  <span className="text-display text-foreground/5 select-none block mb-4 font-extrabold text-7xl leading-none">
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
