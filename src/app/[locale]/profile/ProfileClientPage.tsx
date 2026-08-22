"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Trophy, Mic, CheckCircle, Star, Award, TrendingUp } from "lucide-react";

interface ProfileStats {
  totalContributions: number;
  totalValidations: number;
  avgScoreReceived: number;
  totalRejected: number;
  wordsWon: { word: string; translation: string | null }[];
  rank: number;
  memberSince: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-2xl p-5 flex flex-col gap-3 transition-colors ${
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border hover:border-foreground/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-text-muted"}`} />
      </div>
      <p className={`text-3xl font-display font-bold tracking-tight ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

function StarDisplay({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${
            s <= Math.round(score)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-border"
          }`}
        />
      ))}
      <span className="ml-1.5 text-xs font-mono text-text-muted">{score.toFixed(1)}/5</span>
    </div>
  );
}

export default function ProfileClientPage() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let ignore = false;
    async function fetchStats() {
      try {
        const res = await fetch("/api/me/stats");
        const data = await res.json() as ProfileStats & { error?: string };
        if (!ignore) {
          if (data.error) throw new Error(data.error);
          setStats(data);
        }
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "Erreur de chargement.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchStats();
    return () => { ignore = true; };
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-text-muted font-display uppercase tracking-wider">Chargement du profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-foreground">Connexion requise</h2>
        <p className="text-sm text-text-muted">
          Connectez-vous pour voir votre profil et vos statistiques de contribution.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const memberYear = stats?.memberSince
    ? new Date(stats.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-2">

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
          <span className="text-2xl font-display font-bold text-primary">
            {(user.username || user.firstName || "?")[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
            {user.username || user.firstName || "Contributeur"}
          </h1>
          {memberYear && (
            <p className="text-xs text-text-muted mt-0.5">Membre depuis {memberYear}</p>
          )}
        </div>
        {stats && (
          <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-full">
            <TrendingUp className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-display font-bold text-foreground">
              Rang #{stats.rank}
            </span>
          </div>
        )}
      </div>

      {stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={Mic}
              label="Contributions"
              value={stats.totalContributions}
              sub="Audios enregistrés"
              highlight={stats.totalContributions > 0}
            />
            <StatCard
              icon={CheckCircle}
              label="Validations"
              value={stats.totalValidations}
              sub="Audios notés"
            />
            <StatCard
              icon={Award}
              label="Mots remportés"
              value={stats.wordsWon.length}
              sub="Voix officielle"
              highlight={stats.wordsWon.length > 0}
            />
            <StatCard
              icon={Trophy}
              label="Classement"
              value={`#${stats.rank}`}
              sub="Parmi tous les contributeurs"
            />
          </div>

          {/* Quality Score */}
          {stats.totalContributions > 0 && (
            <div className="border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted">
                  Qualité de vos enregistrements
                </span>
                <Star className="w-4 h-4 text-text-muted" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-text-muted mb-1">Note moyenne reçue</p>
                  <StarDisplay score={stats.avgScoreReceived} />
                </div>
                {stats.totalRejected > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-text-muted mb-1">Rejets</p>
                    <p className="text-lg font-bold font-display text-red-500">{stats.totalRejected}</p>
                  </div>
                )}
              </div>
              {stats.avgScoreReceived === 0 && (
                <p className="text-xs text-text-muted italic">
                  Vos enregistrements n&apos;ont pas encore été notés par la communauté.
                </p>
              )}
            </div>
          )}

          {/* Words Won */}
          {stats.wordsWon.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-display font-bold text-foreground tracking-tight">
                  Votre voix est la voix officielle de ces mots
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {stats.wordsWon.map(({ word, translation }) => (
                  <div
                    key={word}
                    className="border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 space-y-0.5"
                  >
                    <p className="text-sm font-display font-bold text-foreground">{word}</p>
                    {translation && (
                      <p className="text-[10px] text-text-muted truncate">{translation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {stats.totalContributions === 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl space-y-3">
              <Mic className="w-8 h-8 text-text-muted mx-auto" />
              <h3 className="text-lg font-display font-bold text-foreground">
                Commencez à contribuer !
              </h3>
              <p className="text-xs text-text-muted max-w-xs mx-auto">
                Enregistrez votre première voix pour apparaître dans le classement et aider à
                préserver les langues africaines.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-text-muted text-sm">
          Aucune donnée disponible.
        </div>
      )}
    </div>
  );
}
