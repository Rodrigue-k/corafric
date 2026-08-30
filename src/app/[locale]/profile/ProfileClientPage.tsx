"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Trophy, Mic, CheckCircle, Star, Award, TrendingUp, UserCheck, Shield, Check } from "lucide-react";

interface ProfileStats {
  dbUsername?: string | null;
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

  // Username customization state
  const [publicUsername, setPublicUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameSavedSuccess, setUsernameSavedSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

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
        const data = (await res.json()) as ProfileStats & { error?: string };
        if (!ignore) {
          if (data.error) throw new Error(data.error);
          setStats(data);
          const initialName = data.dbUsername || user?.username || user?.firstName || "";
          setPublicUsername(initialName);
        }
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "Erreur de chargement.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchStats();
    return () => {
      ignore = true;
    };
  }, [isLoaded, user]);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUsername.trim()) return;

    setIsSavingUsername(true);
    setUsernameError(null);
    setUsernameSavedSuccess(false);

    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: publicUsername }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour du pseudo.");
      }

      setUsernameSavedSuccess(true);
      if (stats) {
        setStats({ ...stats, dbUsername: data.username });
      }
      setTimeout(() => setUsernameSavedSuccess(false), 4000);
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSavingUsername(false);
    }
  };

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

  const currentDisplayName = stats?.dbUsername || user.username || user.firstName || "Contributeur";

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
          <span className="text-2xl font-display font-bold text-primary">
            {(currentDisplayName || "?")[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
              {currentDisplayName}
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              @{publicUsername || "pseudo"}
            </span>
          </div>
          {memberYear && <p className="text-xs text-text-muted mt-0.5">Membre depuis {memberYear}</p>}
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

      {/* Public Username & Privacy Customization Box */}
      <div className="border border-border/80 rounded-2xl p-6 bg-white/60 backdrop-blur-sm space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-foreground">
                Nom d&apos;affichage public & Confidentialité
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Choisissez le pseudonyme qui s&apos;affichera sur le dictionnaire (« Voix : @votre_pseudo ») et le classement.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveUsername} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">@</span>
            <input
              type="text"
              value={publicUsername}
              onChange={(e) => setPublicUsername(e.target.value)}
              placeholder="votre_pseudo"
              maxLength={30}
              className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingUsername || !publicUsername.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold font-display uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            {isSavingUsername ? (
              "Enregistrement..."
            ) : usernameSavedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Enregistré !
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" /> Enregistrer le pseudo
              </>
            )}
          </button>
        </form>

        {/* Live badge preview */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted pt-1">
          <span>Aperçu sur le dictionnaire :</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 font-medium text-[11px]">
            <Award className="w-3 h-3 text-amber-600" />
            Voix : @{publicUsername.trim() || "votre_pseudo"}
          </span>
        </div>

        {usernameError && (
          <p className="text-xs text-red-600 font-medium">{usernameError}</p>
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
