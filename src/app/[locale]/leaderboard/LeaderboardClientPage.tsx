"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { PioneerBadge } from "@/components/recording/PioneerBadge";
import { LeaderboardEntry } from "@/types";

export const LeaderboardClientPage: React.FC = () => {
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
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <PioneerBadge />
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
          Communauté & Contributions
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground leading-tight">
          Classement des contributeurs
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
          Locuteurs et volontaires participant à la constitution du premier corpus vocal libre en langue Éwé.
        </p>

        {/* Aggregate counts */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-text-muted">
          <span>
            <strong className="font-semibold text-foreground">{totalAudios.toLocaleString()}</strong> audios enregistrés
          </span>
          <span className="text-border">·</span>
          <span>
            <strong className="font-semibold text-foreground">{totalContributors.toLocaleString()}</strong> contributeurs actifs
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[250px] gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-text-muted">Chargement des données...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((entry, index) => (
                <div
                  key={entry.username + index}
                  className={`p-6 rounded-xl border bg-white flex flex-col justify-between ${
                    index === 0
                      ? "border-primary/40 shadow-xs"
                      : "border-border shadow-xs"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-text-muted">
                        0{index + 1}
                      </span>
                      {index === 0 && (
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                          Premier rang
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-foreground truncate">
                        {entry.username}
                      </h3>
                      <p className="text-xs text-text-muted">{entry.country || "Togo"}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex justify-between text-xs">
                    <div>
                      <span className="text-text-muted block">Enregistrements</span>
                      <span className="font-semibold text-foreground text-sm">
                        {entry.total_contributions}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-text-muted block">Validations</span>
                      <span className="font-semibold text-foreground text-sm">
                        {entry.total_validations}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Table */}
          {rest.length > 0 && (
            <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Tous les contributeurs
                </span>
                <span className="text-xs text-text-muted">Classé par audios validés</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-text-muted bg-[#FAF8F5]">
                      <th className="py-3 px-6 font-medium">Rang</th>
                      <th className="py-3 px-6 font-medium">Contributeur</th>
                      <th className="py-3 px-6 font-medium text-center">Audios</th>
                      <th className="py-3 px-6 font-medium text-center">Validations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rest.map((user, idx) => (
                      <tr key={user.username + idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-xs text-text-muted">
                          {String(idx + 4).padStart(2, "0")}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="font-medium text-foreground block">
                            {user.username}
                          </span>
                          <span className="text-xs text-text-muted">
                            {user.country || "Togo"}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center font-medium text-foreground">
                          {user.total_contributions}
                        </td>
                        <td className="py-3.5 px-6 text-center text-text-muted">
                          {user.total_validations}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Action */}
          <div className="bg-white border border-border rounded-xl p-8 text-center space-y-4 shadow-xs">
            <h2 className="text-xl font-bold font-display text-foreground">
              Participez à la construction du corpus
            </h2>
            <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
              Chaque enregistrement soumis est vérifié par la communauté et contribue directement aux modèles d'IA open source.
            </p>
            <div className="pt-2">
              <Link href="/contribute">
                <Button variant="primary" size="md">
                  Commencer à enregistrer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
