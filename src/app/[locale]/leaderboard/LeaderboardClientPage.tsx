"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LeaderboardEntry } from "@/types";

export const LeaderboardClientPage: React.FC = () => {
  const t = useTranslations("leaderboard");
  const tStats = useTranslations("landing.stats");
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
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      {/* Editorial Header */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-text-muted max-w-xl mx-auto">
          {t("subtitle")}
        </p>

        {/* Aggregate counts */}
        <div className="flex items-center justify-center gap-6 pt-4 text-xs font-display tracking-widest text-text-muted uppercase">
          <span>
            <strong className="text-foreground">{totalAudios.toLocaleString()}</strong> {tStats("recordings")}
          </span>
          <span className="text-border">|</span>
          <span>
            <strong className="text-foreground">{totalContributors.toLocaleString()}</strong> {tStats("speakers")}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border-y border-border/50">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Top 3 Editorial Layout */}
          {top3.length > 0 && (
            <div className="flex flex-col md:flex-row gap-0 border-y border-border/50">
              {top3.map((entry, index) => (
                <div
                  key={entry.username + index}
                  className={`flex-1 p-8 sm:p-10 flex flex-col justify-between hover:bg-[#EADCC9]/5 transition-colors ${
                    index !== top3.length - 1 ? "border-b md:border-b-0 md:border-r border-border/50" : ""
                  }`}
                >
                  <div className="space-y-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                      0{index + 1}
                    </span>
                    <h3 className="text-3xl font-display text-foreground truncate tracking-tight">
                      {entry.username}
                    </h3>
                  </div>

                  <div className="mt-12 flex justify-between text-xs font-display tracking-widest uppercase">
                    <div className="space-y-1">
                      <span className="text-text-muted/60">Audios</span>
                      <p className="font-semibold text-foreground">{entry.total_contributions}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-text-muted/60">Validations</span>
                      <p className="font-semibold text-foreground">{entry.total_validations}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Minimalist List for the rest */}
          {rest.length > 0 && (
            <div className="pt-8">
              <div className="flex items-center justify-between pb-4 border-b-2 border-foreground text-xs font-bold font-display uppercase tracking-widest">
                <span>{t("rank")} / {t("user")}</span>
                <div className="flex gap-12 text-right">
                  <span className="w-16">Audios</span>
                  <span className="w-20">Validations</span>
                </div>
              </div>

              <div className="flex flex-col">
                {rest.map((user, idx) => (
                  <div 
                    key={user.username + idx} 
                    className="flex items-center justify-between py-6 border-b border-border/50 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-display text-text-muted/60 w-6">
                        {(idx + 4).toString().padStart(2, '0')}
                      </span>
                      <span className="text-lg font-display text-foreground font-medium truncate max-w-[150px] sm:max-w-[300px]">
                        {user.username}
                      </span>
                    </div>
                    <div className="flex gap-12 text-right text-sm">
                      <span className="w-16 font-medium text-foreground">{user.total_contributions}</span>
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
