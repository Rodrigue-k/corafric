"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { GlobalStats } from "@/types";
import { Button } from "../ui/Button";

const MILESTONES = [
  { target: 2500, label: "2 500", name: "Palier 1" },
  { target: 5000, label: "5 000", name: "Palier 2" },
  { target: 7500, label: "7 500", name: "Palier 3" },
  { target: 10000, label: "10 000", name: "Objectif V1" },
];

export function LiveStats() {
  const t = useTranslations("landing");
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<GlobalStats>({
    totalRecordings: 1248,
    approvedRecordings: 980,
    totalUsers: 84,
    totalHours: 3.4,
    totalSentences: 174066,
    goalRecordings: 10000,
  });

  useEffect(() => {
    let ignore = false;
    void (async () => {
      setMounted(true);
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (!ignore && data) {
          setStats((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.error("Error fetching live stats:", err);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const totalRecordings = mounted ? stats.totalRecordings : 1248;
  const goal = stats.goalRecordings || 10000;
  const progressPercent = Math.min(100, Math.max(0.5, (totalRecordings / goal) * 100));

  return (
    <section className="bg-[#FAF8F5] pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Editorial Block - Clean, no cards, massive typography */}
        <div className="py-12 border-b border-border/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
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

          {/* Architectural Segmented Milestone Progress Bar */}
          <div className="mt-12 lg:mt-16 space-y-4">
            {/* Header with live numbers */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-tight">
                  {totalRecordings.toLocaleString()}
                </span>
                <span className="text-text-muted text-lg sm:text-xl font-display">
                  / {goal.toLocaleString()} audios
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-primary font-bold font-display text-2xl sm:text-3xl">
                  {progressPercent.toFixed(1)}%
                </span>
                <span className="text-text-muted text-xs uppercase tracking-widest ml-2">atteint</span>
              </div>
            </div>

            {/* Segmented Bar Track */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
              {MILESTONES.map((milestone, idx) => {
                const prevTarget = idx === 0 ? 0 : MILESTONES[idx - 1].target;
                const segmentRange = milestone.target - prevTarget;
                const segmentProgress = Math.max(
                  0,
                  Math.min(1, (totalRecordings - prevTarget) / segmentRange)
                );
                const isCompleted = segmentProgress >= 1;
                const isActive = segmentProgress > 0 && segmentProgress < 1;

                return (
                  <div key={milestone.target} className="space-y-2">
                    {/* Bar segment */}
                    <div className="h-2.5 sm:h-3 w-full bg-[#EADCC9]/50 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${segmentProgress * 100}%` }}
                      />
                    </div>

                    {/* Milestone meta */}
                    <div className="flex justify-between items-center text-[10px] sm:text-xs">
                      <span className={`font-medium ${isCompleted || isActive ? 'text-primary font-semibold' : 'text-text-muted/60'}`}>
                        {milestone.name}
                      </span>
                      <span className="text-text-muted font-mono font-medium">
                        {milestone.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Minimalist Stats Grid - No cards, just typography and thin lines */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 py-12">
          {/* Stat 1 */}
          <div className="border-l-2 border-primary/40 pl-5">
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">Validés</p>
            <p className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
              {stats.approvedRecordings.toLocaleString()}
            </p>
          </div>
          {/* Stat 2 */}
          <div className="border-l-2 border-border/60 pl-5">
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">Heures</p>
            <p className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
              {stats.totalHours.toFixed(1)}
            </p>
          </div>
          {/* Stat 3 */}
          <div className="border-l-2 border-border/60 pl-5">
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">Phrases</p>
            <p className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
              {stats.totalSentences.toLocaleString()}
            </p>
          </div>
          {/* Stat 4 */}
          <div className="border-l-2 border-border/60 pl-5">
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">Contributeurs</p>
            <p className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
              {stats.totalUsers.toLocaleString()}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
