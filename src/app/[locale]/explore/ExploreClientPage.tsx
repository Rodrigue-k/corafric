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
    { name: "Ewe (ɛʋɛgbɛ)", status: "active", count: stats?.totalRecordings || 0 },
    { name: "Yoruba (Yorùbá)", status: "soon", count: 0 },
    { name: "Fon (Fɔngbe)", status: "soon", count: 0 },
    { name: "Wolof (Wollof)", status: "soon", count: 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-12 py-6">
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <span className="text-[10px] sm:text-xs font-bold font-display uppercase tracking-widest text-primary block">
          Données ouvertes
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl text-foreground font-display font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-text-muted max-w-xl mx-auto">
          Explorez et téléchargez les jeux de données vocales collectés pour la recherche et les modèles de traitement vocal.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[260px] border-y border-border/40 py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Stats Counters Grid — Editorial, flat */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-border/50">
            <div className="border-l-2 border-primary/40 pl-4 sm:pl-5">
              <p className="text-xs text-text-muted uppercase tracking-widest font-medium mb-1">Audios</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-foreground">{stats.totalRecordings.toLocaleString()}</p>
            </div>
            <div className="border-l-2 border-border/60 pl-4 sm:pl-5">
              <p className="text-xs text-text-muted uppercase tracking-widest font-medium mb-1">Validés</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-foreground">{stats.approvedRecordings.toLocaleString()}</p>
            </div>
            <div className="border-l-2 border-border/60 pl-4 sm:pl-5">
              <p className="text-xs text-text-muted uppercase tracking-widest font-medium mb-1">Heures audio</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-foreground">{stats.totalHours.toFixed(1)}h</p>
            </div>
            <div className="border-l-2 border-border/60 pl-4 sm:pl-5">
              <p className="text-xs text-text-muted uppercase tracking-widest font-medium mb-1">Contributeurs</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>

          {/* Main Content Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Side: Leaderboard */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">{t("leaderboardTitle")}</h2>
              </div>

              <div className="divide-y divide-border/40">
                {stats.leaderboard?.map((user, index) => {
                  return (
                    <div
                      key={user.username}
                      className="group flex items-center justify-between py-4 hover:bg-[#FAF8F5] -mx-4 px-4 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-text-muted/60 font-semibold w-6">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>

                        <div>
                          <p className="text-sm sm:text-base font-bold font-display text-foreground flex items-center gap-1.5">
                            {user.username}
                            {index === 0 && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />}
                          </p>
                          <p className="text-[11px] text-text-muted font-medium">
                            {user.total_validations} validations
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-bold font-display text-primary">
                          {user.total_contributions}
                        </span>
                        <span className="text-[10px] text-text-muted ml-1.5 uppercase tracking-wider font-medium">audios</span>
                      </div>
                    </div>
                  );
                })}

                {(!stats.leaderboard || stats.leaderboard.length === 0) && (
                  <div className="py-8 text-center text-xs text-text-muted">
                    Aucun contributeur répertorié.
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Download & Languages */}
            <div className="lg:col-span-5 space-y-10">
              {/* Download Section */}
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-display font-bold text-foreground flex items-center gap-2.5 border-b border-border/50 pb-3">
                  <Download className="w-4 h-4 text-primary" />
                  {t("downloadTitle")}
                </h2>

                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {t("downloadDesc")}
                </p>

                <div className="space-y-2 text-xs text-text-muted">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span>Licence</span>
                    <span className="font-semibold text-foreground">CC-BY (Libre)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span>Format Audio</span>
                    <span className="font-semibold text-foreground">WebM (OPUS)</span>
                  </div>
                </div>

                <Button variant="primary" disabled className="w-full h-11 text-xs uppercase tracking-wider font-display rounded-full">
                  {t("downloadBtn")}
                </Button>
              </div>

              {/* Languages Section */}
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-display font-bold text-foreground flex items-center gap-2.5 border-b border-border/50 pb-3">
                  <Globe className="w-4 h-4 text-primary" />
                  Langues
                </h2>

                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div
                      key={lang.name}
                      className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-b-0 text-xs sm:text-sm"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{lang.name}</p>
                        {lang.status === "active" && (
                          <p className="text-[11px] text-text-muted">
                            {lang.count.toLocaleString()} enregistrements
                          </p>
                        )}
                      </div>

                      <Badge variant={lang.status === "active" ? "success" : "outline"} className="px-2.5 py-0.5 text-[10px]">
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
          <p className="text-text-muted">Erreur de chargement.</p>
        </div>
      )}
    </div>
  );
}
