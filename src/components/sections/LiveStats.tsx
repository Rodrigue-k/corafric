"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { GlobalStats } from "@/types";
import { Button } from "../ui/Button";

const MILESTONES = [2500, 5000, 7500, 10000];

export function LiveStats() {
  const t = useTranslations("landing");
  const [stats, setStats] = useState<GlobalStats>({
    totalRecordings: 0,
    approvedRecordings: 0,
    totalUsers: 0,
    totalHours: 0,
    totalSentences: 0,
    goalRecordings: 10000,
  });

  const [animatedCount, setAnimatedCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchLiveStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (!ignore && data) {
          setStats((prev) => ({
            ...prev,
            ...data,
          }));
          setIsLoaded(true);

          // Smoothly count up from 0 to target
          const target = Number(data.totalRecordings) || 0;
          if (target > 0) {
            const duration = 1200; // ms
            const startTime = performance.now();

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease-out cubic
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const current = Math.round(target * easeOut);

              setAnimatedCount(current);

              if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
              } else {
                setAnimatedCount(target);
              }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
          }
        }
      } catch (err) {
        console.error("Error fetching live stats:", err);
      }
    }

    void fetchLiveStats();
    return () => {
      ignore = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const goal = stats.goalRecordings || 10000;
  const currentCount = isLoaded ? animatedCount : 0;
  const progressPercent = Math.min(100, Math.max(0, (currentCount / goal) * 100));

  return (
    <section className="bg-[#FAF8F5] pb-20 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Editorial Block */}
        <div className="py-10 border-b border-border/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary block font-display">
                Objectif Collectif
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground leading-tight tracking-tight">
                10 000 voix pour l'Afrique.
              </h2>
            </div>
            <div className="lg:col-span-5 flex flex-col lg:flex-row gap-4 lg:items-center justify-start lg:justify-end">
              <Link href="/contribute">
                <Button variant="primary" size="lg" className="rounded-full px-8">
                  {t("ctaPrimary")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Minimalist Milestone Progress Bar — Clean, no text overload */}
          <div className="mt-10 lg:mt-12 space-y-3">
            {/* Header numbers */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-tight tabular-nums">
                  {currentCount.toLocaleString()}
                </span>
                <span className="text-text-muted text-lg sm:text-xl font-display">
                  / {goal.toLocaleString()} audios
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-primary font-bold font-display text-2xl sm:text-3xl tabular-nums">
                  {progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Segmented Milestone Bar Track */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
              {MILESTONES.map((target, idx) => {
                const prevTarget = idx === 0 ? 0 : MILESTONES[idx - 1];
                const segmentRange = target - prevTarget;
                const segmentProgress = Math.max(
                  0,
                  Math.min(1, (currentCount - prevTarget) / segmentRange)
                );

                return (
                  <div key={target} className="space-y-1.5">
                    {/* Segment track */}
                    <div className="h-2 sm:h-2.5 w-full bg-[#EADCC9]/50 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-150 ease-out"
                        style={{ width: `${segmentProgress * 100}%` }}
                      />
                    </div>

                    {/* Clean milestone number only */}
                    <div className="text-right text-[11px] font-mono text-text-muted/70">
                      {target.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Minimalist Stats Grid - Instant display, zero jumping animation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 py-10">
          {/* Stat 1 */}
          <div className="border-l-2 border-primary/40 pl-4 sm:pl-5">
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-1">Validés</p>
            <p className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight tabular-nums">
              {isLoaded ? stats.approvedRecordings.toLocaleString() : "—"}
            </p>
          </div>
          {/* Stat 2 */}
          <div className="border-l-2 border-border/60 pl-4 sm:pl-5">
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-1">Heures</p>
            <p className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight tabular-nums">
              {isLoaded ? `${stats.totalHours.toFixed(1)}h` : "—"}
            </p>
          </div>
          {/* Stat 3 */}
          <div className="border-l-2 border-border/60 pl-4 sm:pl-5">
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-1">Phrases</p>
            <p className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight tabular-nums">
              {isLoaded ? stats.totalSentences.toLocaleString() : "—"}
            </p>
          </div>
          {/* Stat 4 */}
          <div className="border-l-2 border-border/60 pl-4 sm:pl-5">
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-1">Contributeurs</p>
            <p className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight tabular-nums">
              {isLoaded ? stats.totalUsers.toLocaleString() : "—"}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
