"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check } from "lucide-react";

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
      setTimeout(() => setUsernameSavedSuccess(false), 3000);
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
    <div className="max-w-4xl mx-auto space-y-12 py-4">
      {/* Profile Header — Clean, Flat */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-border/60 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <span className="text-xl font-display font-bold text-primary">
              {(currentDisplayName || "?")[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
                {currentDisplayName}
              </h1>
              <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded-full border border-border/60">
                @{publicUsername || "pseudo"}
              </span>
            </div>
            {memberYear && <p className="text-xs text-text-muted mt-1">Membre depuis {memberYear}</p>}
          </div>
        </div>

        {stats && (
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
              Classement
            </span>
            <span className="text-xl font-display font-bold text-foreground">
              Rang #{stats.rank}
            </span>
          </div>
        )}
      </div>

      {/* Public Username Settings — Clean Minimalist Form */}
      <div className="border-b border-border/60 pb-8 space-y-4">
        <div>
          <span className="text-[10px] font-bold font-display uppercase tracking-widest text-primary block">
            Identite publique et Confidentialite
          </span>
          <p className="text-xs text-text-muted mt-1">
            Ce pseudonyme s'affichera publiquement sur le dictionnaire (« Voix : @votre_pseudo ») et le classement.
          </p>
        </div>

        <form onSubmit={handleSaveUsername} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">@</span>
            <input
              type="text"
              value={publicUsername}
              onChange={(e) => setPublicUsername(e.target.value)}
              placeholder="votre_pseudo"
              maxLength={30}
              className="w-full pl-8 pr-4 py-2 bg-transparent border border-border/80 rounded-lg text-sm font-mono text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingUsername || !publicUsername.trim()}
            className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-bold font-display uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            {isSavingUsername ? (
              "Enregistrement..."
            ) : usernameSavedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Enregistre
              </>
            ) : (
              "Enregistrer le pseudo"
            )}
          </button>
        </form>

        {usernameError && (
          <p className="text-xs text-red-600 font-medium">{usernameError}</p>
        )}
      </div>

      {stats ? (
        <>
          {/* Stats Metrics — Editorial Flat Split */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-border/60 pb-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
                Contributions
              </span>
              <p className="text-3xl font-display font-bold text-foreground">
                {stats.totalContributions}
              </p>
              <p className="text-xs text-text-muted">Audios enregistres</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
                Validations
              </span>
              <p className="text-3xl font-display font-bold text-foreground">
                {stats.totalValidations}
              </p>
              <p className="text-xs text-text-muted">Audios notes</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
                Mots remportes
              </span>
              <p className="text-3xl font-display font-bold text-primary">
                {stats.wordsWon.length}
              </p>
              <p className="text-xs text-text-muted">Voix officielle</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
                Note moyenne
              </span>
              <p className="text-3xl font-display font-bold text-foreground font-mono">
                {stats.avgScoreReceived > 0 ? `${stats.avgScoreReceived.toFixed(1)}/5` : "—"}
              </p>
              <p className="text-xs text-text-muted">Score communautaire</p>
            </div>
          </div>

          {/* Words Won Section */}
          {stats.wordsWon.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
                Mots dont vous etes la Voix Officielle
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {stats.wordsWon.map(({ word, translation }) => (
                  <div
                    key={word}
                    className="border border-border/60 p-3 rounded-lg space-y-0.5"
                  >
                    <p className="text-sm font-display font-bold text-foreground">{word}</p>
                    {translation && (
                      <p className="text-xs text-text-muted truncate">{translation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {stats.totalContributions === 0 && (
            <div className="text-center py-12 space-y-2">
              <h3 className="text-lg font-display font-bold text-foreground">
                Commencez a contribuer
              </h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                Enregistrez votre premier mot pour apparaitre dans le classement et contribuer a la preservation linguistique.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-text-muted text-sm">
          Aucune donnee disponible.
        </div>
      )}
    </div>
  );
}
