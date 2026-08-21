"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LeaderboardEntry } from "@/types";
import { Trophy, Mic } from "lucide-react";

export const LeaderboardClientPage: React.FC = () => {
  const t = useTranslations("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalAudios, setTotalAudios] = useState<number>(0);
  const [totalContributors, setTotalContributors] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (!ignore && data) {
          if (data.leaderboard) setLeaderboard(data.leaderboard);
          if (data.totalRecordings) setTotalAudios(data.totalRecordings);
          if (data.totalUsers) setTotalContributors(data.totalUsers);
        }
      } catch (err) {
        console.error("Error fetching leaderboard stats:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void fetchStats();
    return () => {
      ignore = true;
    };
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <span className="text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-primary block">
          Reconnaissance communautaire
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-text-muted max-w-xl mx-auto">
          {t("subtitle")}
        </p>

        <div className="flex items-center justify-center gap-3 pt-2 text-xs font-display tracking-wider uppercase text-text-muted">
          <span>
            <strong className="text-foreground">{totalAudios.toLocaleString()}</strong> audios
          </span>
          <span className="text-border">·</span>
          <span>
            <strong className="text-foreground">{totalContributors.toLocaleString()}</strong> contributeurs
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[260px] border-y border-border/40 py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Top 3 Podium Layout — Elegant, Warm Structure */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((entry, index) => {
                const rankLabels = ["1er", "2ème", "3ème"];
                const rankColors = [
                  "bg-amber-500/10 text-amber-600 border-amber-500/30",
                  "bg-slate-400/10 text-slate-600 border-slate-400/30",
                  "bg-amber-700/10 text-amber-700 border-amber-700/30",
                ];

                return (
                  <div
                    key={entry.username + index}
                    className="bg-white border border-border/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs hover:border-primary/50 transition-all group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${rankColors[index]}`}>
                          {rankLabels[index]}
                        </span>
                        {index === 0 && <Trophy className="w-4 h-4 text-amber-500" />}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors truncate tracking-tight">
                        {entry.username}
                      </h3>
                    </div>

                    <div className="mt-8 pt-4 border-t border-border/40 flex justify-between text-xs font-display tracking-wider uppercase">
                      <div className="space-y-0.5">
                        <span className="text-text-muted/60 text-[10px]">Audios</span>
                        <p className="font-bold text-sm text-foreground">{entry.total_contributions}</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-text-muted/60 text-[10px]">Validations</span>
                        <p className="font-bold text-sm text-foreground">{entry.total_validations}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Minimalist List for the rest */}
          {rest.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-text-muted">
                <span>{t("rank")} · {t("user")}</span>
                <div className="flex gap-8 sm:gap-12 text-right">
                  <span className="w-16">Audios</span>
                  <span className="w-20">Validations</span>
                </div>
              </div>

              <div className="divide-y divide-border/40">
                {rest.map((user, idx) => (
                  <div 
                    key={user.username + idx} 
                    className="flex items-center justify-between py-4 hover:bg-[#FAF8F5] -mx-4 px-4 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className="text-xs sm:text-sm font-mono text-text-muted/60 w-6 font-semibold">
                        {(idx + 4).toString().padStart(2, '0')}
                      </span>
                      <span className="text-sm sm:text-base font-display text-foreground font-semibold truncate max-w-[150px] sm:max-w-[280px]">
                        {user.username}
                      </span>
                    </div>
                    <div className="flex gap-8 sm:gap-12 text-right text-xs sm:text-sm">
                      <span className="w-16 font-bold text-foreground">{user.total_contributions}</span>
                      <span className="w-20 font-medium text-text-muted">{user.total_validations}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
