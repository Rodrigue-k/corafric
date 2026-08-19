"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { GlobalStats } from "@/types";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../ui/Button";

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
    <section className="bg-[#FAF8F5] py-20 border-y border-border/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Goal Panel */}
        <div className="bg-white rounded-2xl border border-border p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Objectif de collecte · Phase 1
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground leading-tight">
                Construire les 10 000 premiers enregistrements de référence
              </h2>
              <p className="text-sm text-text-muted max-w-xl leading-relaxed">
                Chaque phrase et chaque mot enregistré sont nettoyés, validés par la communauté et intégrés à notre jeu de données ouvert sous licence libre.
              </p>

              {/* Minimal Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="w-full bg-[#F0ECE6] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-text-muted font-medium">
                  <span>{totalRecordings.toLocaleString()} enregistrés</span>
                  <span className="font-semibold text-foreground">{progressPercent.toFixed(1)}%</span>
                  <span>{goal.toLocaleString()} objectif</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-4 lg:items-end justify-center">
              <Link href="/contribute" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full justify-center">
                  Participer à l'enregistrement
                </Button>
              </Link>
              <Link href="/leaderboard" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full justify-center group">
                  Consulter le classement
                  <ArrowUpRight className="w-4 h-4 ml-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="border-l-2 border-primary/30 pl-5 py-2">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
              {t("stats.recordings")}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              {mounted ? stats.totalRecordings.toLocaleString() : "0"}
            </p>
          </div>

          <div className="border-l-2 border-border pl-5 py-2">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
              {t("stats.speakers")}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              {mounted ? stats.totalUsers.toLocaleString() : "0"}
            </p>
          </div>

          <div className="border-l-2 border-border pl-5 py-2">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
              {t("stats.hours")}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              {mounted ? (stats.totalHours || 0).toLocaleString() : "0"} h
            </p>
          </div>

          <div className="border-l-2 border-border pl-5 py-2">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
              Corpus disponible
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              {(stats.totalSentences || 174066).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
