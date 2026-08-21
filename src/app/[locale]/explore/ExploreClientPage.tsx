"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Trophy, Download, Globe, Star } from "lucide-react";

interface LeaderboardUser {
  username: string;
  total_contributions: number;
  total_validations: number;
}

interface ExploreStats {
  totalRecordings: number;
  approvedRecordings: number;
  totalUsers: number;
  totalHours: number;
  totalSentences: number;
  leaderboard: LeaderboardUser[];
}

export default function ExploreClientPage() {
  const t = useTranslations("explore");
  const [stats, setStats] = useState<ExploreStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error("Error loading explore stats:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const languages = [
    { name: "Ewe (ɛʋɛgbɛ)", status: "active", count: stats?.totalRecordings || 1248 },
    { name: "Yoruba (Yorùbá)", status: "soon", count: 0 },
    { name: "Fon (Fɔngbe)", status: "soon", count: 0 },
    { name: "Wolof (Wollof)", status: "soon", count: 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-16">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl text-foreground font-display font-bold tracking-tight">
          {t("title")}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Stats Counters Grid - Minimalist Typography */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-border/50">
            <div className="border-l-2 border-primary/30 pl-4">
              <p className="text-xs text-text-muted uppercase tracking-widest font-medium mb-1">Audios</p>
              <p className="text-3xl sm:text-4xl font-display font-bold text-foreground">{stats.totalRecordings.toLocaleString()}</p>
            </div>
            <div className="border-l-2 border-border/60 pl-4">
              <p className="text-xs text-text-muted uppercase tracking-widest font-medium mb-1">Validés</p>
              <p className="text-3xl sm:text-4xl font-display font-bold text-foreground">{stats.approvedRecordings.toLocaleString()}</p>
            </div>
            <div className="border-l-2 border-border/60 pl-4">
              <p className="text-xs text-text-muted uppercase tracking-widest font-medium mb-1">Heures audio</p>
              <p className="text-3xl sm:text-4xl font-display font-bold text-foreground">{stats.totalHours}h</p>
            </div>
            <div className="border-l-2 border-border/60 pl-4">
              <p className="text-xs text-text-muted uppercase tracking-widest font-medium mb-1">Contributeurs</p>
              <p className="text-3xl sm:text-4xl font-display font-bold text-foreground">{stats.totalUsers}</p>
            </div>
          </div>

          {/* Main Content Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Side: Leaderboard */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <Trophy className="w-6 h-6 text-foreground" />
                <h2 className="text-2xl font-display font-bold text-foreground">{t("leaderboardTitle")}</h2>
              </div>

              <div className="divide-y divide-border/60">
                {stats.leaderboard?.map((user, index) => {
                  const rankColors = [
                    "text-yellow-600 bg-yellow-50",
                    "text-slate-600 bg-slate-50",
                    "text-amber-700 bg-amber-50",
                  ];

                  return (
                    <div
                      key={user.username}
                      className="group flex items-center justify-between py-6 hover:bg-[#FAF8F5] transition-colors -mx-4 px-4 rounded-xl"
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            index < 3
                              ? rankColors[index]
                              : "text-text-muted bg-[#FAF8F5]"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                            {user.username}
                            {index === 0 && <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />}
                          </p>
                          <p className="text-xs text-text-muted font-medium">
                            {user.total_validations} validations
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-bold font-display text-primary">
                          {user.total_contributions}
                        </span>
                        <span className="text-xs text-text-muted ml-2 uppercase tracking-wider font-medium">audios</span>
                      </div>
                    </div>
                  );
                })}

                {(!stats.leaderboard || stats.leaderboard.length === 0) && (
                  <div className="py-12 text-center text-text-muted">
                    Aucun contributeur.
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Download & Languages */}
            <div className="lg:col-span-5 space-y-12">
              {/* Download Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3 border-b border-border/50 pb-4">
                  <Download className="w-5 h-5 text-foreground" />
                  {t("downloadTitle")}
                </h2>

                <div className="space-y-6">
                  <p className="text-sm text-text-muted leading-relaxed">
                    {t("downloadDesc")}
                  </p>

                  <div className="space-y-3 pt-2 text-sm text-text-muted">
                    <div className="flex justify-between items-center py-2 border-b border-border/40">
                      <span>Licence</span>
                      <span className="font-medium text-foreground">CC-BY (Libre)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/40">
                      <span>Format Audio</span>
                      <span className="font-medium text-foreground">WebM (OPUS)</span>
                    </div>
                  </div>

                  <Button variant="primary" disabled className="w-full h-12 text-base">
                    {t("downloadBtn")}
                  </Button>
                </div>
              </div>

              {/* Languages Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3 border-b border-border/50 pb-4">
                  <Globe className="w-5 h-5 text-foreground" />
                  Langues
                </h2>

                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div
                      key={lang.name}
                      className="flex items-center justify-between py-4 border-b border-border/40 last:border-b-0"
                    >
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">{lang.name}</p>
                        {lang.status === "active" && (
                          <p className="text-xs text-text-muted">
                            {lang.count.toLocaleString()} enregistrements
                          </p>
                        )}
                      </div>

                      <Badge variant={lang.status === "active" ? "success" : "outline"} className="px-3 py-1">
                        {lang.status === "active" ? "Actif" : "Bientôt"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-muted">Erreur.</p>
        </div>
      )}
    </div>
  );
}
