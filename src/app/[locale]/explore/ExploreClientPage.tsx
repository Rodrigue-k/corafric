"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
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
    <div className="mx-auto max-w-7xl space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-h1 text-foreground font-display">{t("title")}</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-body text-text-muted">Chargement...</p>
        </div>
      ) : stats ? (
        <>
          {/* Stats Counters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 text-center space-y-2">
              <p className="text-display text-primary text-3xl font-bold">{stats.totalRecordings.toLocaleString()}</p>
              <p className="text-label text-text-muted uppercase">Audios</p>
            </Card>
            <Card className="p-6 text-center space-y-2">
              <p className="text-display text-accent text-3xl font-bold">{stats.approvedRecordings.toLocaleString()}</p>
              <p className="text-label text-text-muted uppercase">Validés</p>
            </Card>
            <Card className="p-6 text-center space-y-2">
              <p className="text-display text-foreground text-3xl font-bold">{stats.totalHours}h</p>
              <p className="text-label text-text-muted uppercase">Heures audio</p>
            </Card>
            <Card className="p-6 text-center space-y-2">
              <p className="text-display text-foreground text-3xl font-bold">{stats.totalUsers}</p>
              <p className="text-label text-text-muted uppercase">Contributeurs</p>
            </Card>
          </div>

          {/* Main Content Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Leaderboard */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 pb-2">
                <Trophy className="w-6 h-6 text-accent" />
                <h2 className="text-h2 font-display text-foreground">{t("leaderboardTitle")}</h2>
              </div>

              <Card className="p-0 border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {stats.leaderboard?.map((user, index) => {
                    const rankColors = [
                      "text-yellow-600 bg-yellow-50 border-yellow-200",
                      "text-slate-600 bg-slate-50 border-slate-200",
                      "text-amber-700 bg-amber-50 border-amber-200",
                    ];

                    return (
                      <div
                        key={user.username}
                        className="flex items-center justify-between p-4 hover:bg-black/[0.01] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm ${
                              index < 3
                                ? rankColors[index]
                                : "text-text-muted bg-transparent border-border"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                              {user.username}
                              {index === 0 && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />}
                            </p>
                            <p className="text-xs text-text-muted">
                              {user.total_validations} validations
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-h3 font-bold text-primary">
                            {user.total_contributions}
                          </span>
                          <span className="text-xs text-text-muted ml-1">audios</span>
                        </div>
                      </div>
                    );
                  })}

                  {(!stats.leaderboard || stats.leaderboard.length === 0) && (
                    <div className="p-8 text-center text-text-muted text-body">
                      Aucun contributeur.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Side: Download & Languages */}
            <div className="lg:col-span-5 space-y-8">
              {/* Download Card */}
              <div className="space-y-4">
                <h2 className="text-h2 font-display text-foreground flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  {t("downloadTitle")}
                </h2>

                <Card className="p-6 border-primary/10 bg-primary-tint/20 space-y-6">
                  <div className="space-y-2">
                    <p className="text-caption text-text-muted">
                      {t("downloadDesc")}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-border/80 pt-4 text-xs text-text-muted space-y-2">
                    <div className="flex justify-between">
                      <span>Licence :</span>
                      <span className="font-semibold text-foreground">CC-BY (Libre)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format Audio :</span>
                      <span className="font-semibold text-foreground">WebM (OPUS)</span>
                    </div>
                  </div>

                  <Button variant="primary" disabled className="w-full">
                    {t("downloadBtn")}
                  </Button>
                </Card>
              </div>

              {/* Languages Card */}
              <div className="space-y-4">
                <h2 className="text-h2 font-display text-foreground flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent" />
                  Langues
                </h2>

                <Card className="p-4 space-y-4">
                  {languages.map((lang) => (
                    <div
                      key={lang.name}
                      className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">{lang.name}</p>
                        {lang.status === "active" && (
                          <p className="text-caption text-text-muted">
                            {lang.count} enregistrements
                          </p>
                        )}
                      </div>

                      <Badge variant={lang.status === "active" ? "success" : "outline"}>
                        {lang.status === "active" ? "Actif" : "Bientôt"}
                      </Badge>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-body text-text-muted">Erreur.</p>
        </div>
      )}
    </div>
  );
}
