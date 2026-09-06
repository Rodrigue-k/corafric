"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LeaderboardEntry } from "@/types";
import { Trophy, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

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
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Compact Editorial Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-primary block">
          Reconnaissance communautaire
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground tracking-tight">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          {t("subtitle")}
        </p>

        <div className="flex items-center justify-center gap-3 pt-1 text-xs font-display tracking-wider uppercase text-text-muted">
          <span>
            <strong className="text-foreground">{totalAudios.toLocaleString()}</strong> {t("contributions").toLowerCase()}
          </span>
          <span className="text-border">·</span>
          <span>
            <strong className="text-foreground">{totalContributors.toLocaleString()}</strong> contributeurs
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[220px] border-y border-border/40 py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        /* Empty State: Clean Editorial Invitation */
        <div className="border border-border/70 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto bg-[#FAF8F5]/50">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {t("emptyTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              {t("emptySubtitle")}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/contribute">
              <Button variant="primary" size="md" className="rounded-full px-6 gap-2">
                <span>{t("emptyCta")}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Podium — Flat, Cardless Structure with Score Emphasis */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {top3.map((entry, index) => {
                const rankLabels = ["1er", "2ème", "3ème"];
                const rankPillStyles = [
                  "text-amber-700 border-amber-500/40 bg-amber-500/10",
                  "text-slate-700 border-slate-400/40 bg-slate-400/10",
                  "text-amber-900 border-amber-700/40 bg-amber-700/10",
                ];

                return (
                  <div
                    key={entry.username + index}
                    className="border border-border/70 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-primary/50 transition-colors bg-transparent group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${rankPillStyles[index]}`}>
                          {rankLabels[index]}
                        </span>
                        {index === 0 && <Trophy className="w-4 h-4 text-amber-600" />}
                      </div>

                      <div>
                        <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors truncate tracking-tight">
                          {entry.username}
                        </h3>
                        <p className="text-xs font-mono font-bold text-primary mt-0.5">
                          {(entry.score || 0).toLocaleString()} pts
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-border/40 flex justify-between text-xs font-display tracking-wider uppercase">
                      <div className="space-y-0.5">
                        <span className="text-text-muted/60 text-[10px]">{t("contributions")}</span>
                        <p className="font-bold text-sm text-foreground">{entry.total_contributions}</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-text-muted/60 text-[10px]">{t("validations")}</span>
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
            <div className="pt-2">
              <div className="flex items-center justify-between pb-2.5 border-b border-border/60 text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-text-muted">
                <span>{t("rank")} · {t("user")}</span>
                <div className="flex gap-4 sm:gap-10 text-right">
                  <span className="w-16 sm:w-20 font-bold text-primary">{t("score")}</span>
                  <span className="w-14 sm:w-16 hidden sm:inline-block">{t("contributions")}</span>
                  <span className="w-16 sm:w-20 hidden sm:inline-block">{t("validations")}</span>
                </div>
              </div>

              <div className="divide-y divide-border/40">
                {rest.map((user, idx) => (
                  <div 
                    key={user.username + idx} 
                    className="flex items-center justify-between py-3.5 hover:bg-[#FAF8F5] -mx-3 px-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className="text-xs sm:text-sm font-mono text-text-muted/60 w-6 font-semibold">
                        {(idx + 4).toString().padStart(2, '0')}
                      </span>
                      <span className="text-sm sm:text-base font-display text-foreground font-semibold truncate max-w-[140px] sm:max-w-[240px]">
                        {user.username}
                      </span>
                    </div>
                    <div className="flex gap-4 sm:gap-10 text-right text-xs sm:text-sm items-center">
                      <span className="w-16 sm:w-20 font-bold text-primary font-mono">
                        {(user.score || 0).toLocaleString()}
                      </span>
                      <span className="w-14 sm:w-16 font-medium text-foreground hidden sm:inline-block">
                        {user.total_contributions}
                      </span>
                      <span className="w-16 sm:w-20 font-medium text-text-muted hidden sm:inline-block">
                        {user.total_validations}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scoring rule explanation note */}
          <div className="text-center pt-4 border-t border-border/40">
            <p className="text-[11px] font-mono text-text-muted/70 tracking-wide">
              {t("scoringRule")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
