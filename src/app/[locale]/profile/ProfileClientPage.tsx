"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { formatDisplayName } from "@/lib/userUtils";

interface ProfileStats {
  dbUsername?: string | null;
  score?: number;
  totalContributions: number;
  totalValidations: number;
  approvedCount?: number;
  bestCount?: number;
  avgScoreReceived: number;
  totalRejected: number;
  wordsWon: { word: string; translation: string | null }[];
  rank: number;
  memberSince: string;
}

export default function ProfileClientPage() {
  const t = useTranslations("profile");
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
          const rawDbName = data.dbUsername;
          const isRawId = rawDbName && (rawDbName.startsWith("contributeur_user_") || rawDbName.startsWith("validateur_user_"));
          const initialName = (!isRawId && rawDbName) ? rawDbName : user?.username || user?.firstName || "";
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

  // Auth loading skeleton
  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12 py-2 sm:py-4 animate-pulse">
        <div className="flex items-center gap-4 pb-8 border-b border-border/60">
          <div className="w-14 h-14 rounded-full bg-[#FAF9F6] border border-[#E8E5DF]" />
          <div className="space-y-2">
            <div className="h-6 w-44 bg-[#FAF9F6] rounded" />
            <div className="h-4 w-28 bg-[#FAF9F6] rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-8 border-b border-border/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-[#FAF9F6] rounded" />
              <div className="h-8 w-16 bg-[#FAF9F6] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-foreground">{t("requireAuthTitle")}</h2>
        <p className="text-sm text-text-muted">
          {t("requireAuthDesc")}
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

  const currentDisplayName = formatDisplayName(stats?.dbUsername, user, user.id);

  return (
    <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12 py-2 sm:py-4">
      {/* Profile Header — Clean, Flat, Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-border/60 pb-6 sm:pb-8">
        <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#F9EBE6] flex items-center justify-center border border-[#F2D7CE] shrink-0">
            <span className="text-lg sm:text-xl font-display font-bold text-[#B84A2A]">
              {(currentDisplayName || "?")[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight truncate max-w-full">
                {currentDisplayName}
              </h1>
              {(publicUsername || user.username) && (
                <span className="text-[10px] sm:text-[11px] font-mono text-text-muted px-2 py-0.5 rounded-full border border-border/60 max-w-[160px] truncate shrink-0">
                  @{publicUsername || user.username}
                </span>
              )}
            </div>
            {memberYear ? (
              <p className="text-xs text-text-muted mt-0.5">{t("memberSince")} {memberYear}</p>
            ) : (
              <p className="text-xs text-text-muted mt-0.5">Membre de la communauté Corafric</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-left sm:text-right space-y-1 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 animate-pulse">
            <div className="h-3 w-28 bg-[#FAF9F6] rounded sm:ml-auto" />
            <div className="h-6 w-32 bg-[#FAF9F6] border border-[#E8E5DF] rounded sm:ml-auto" />
          </div>
        ) : stats ? (
          <div className="text-left sm:text-right space-y-0.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
            <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
              {t("leaderboardAndScore")}
            </span>
            <div className="flex items-baseline sm:justify-end gap-2">
              <span className="text-lg sm:text-xl font-display font-bold text-foreground">
                {t("rankNumber", { rank: stats.rank })}
              </span>
              <span className="text-sm font-mono font-bold text-primary">
                ({(stats.score || 0).toLocaleString()} {t("points")})
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Public Username Settings — Clean Minimalist Form */}
      <div className="border-b border-border/60 pb-8 space-y-4">
        <div>
          <span className="text-[10px] font-bold font-display uppercase tracking-widest text-primary block">
            {t("publicIdentityTitle")}
          </span>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            {t("publicIdentityDesc")}
          </p>
        </div>

        <form onSubmit={handleSaveUsername} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted/60">@</span>
            <input
              type="text"
              value={publicUsername}
              onChange={(e) => setPublicUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="pseudo_public"
              maxLength={24}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#E8E5DF] rounded-lg text-foreground font-mono focus:outline-none focus:border-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingUsername || !publicUsername.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {isSavingUsername ? (
              t("saving")
            ) : usernameSavedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t("saved")}</span>
              </>
            ) : (
              t("savePseudo")
            )}
          </button>
        </form>

        {usernameError && (
          <p className="text-xs text-red-600 font-medium">{usernameError}</p>
        )}
      </div>

      {/* Stats Metrics — Editorial Flat Split */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-border/60 pb-8">
        <div className="space-y-1">
          <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
            {t("contributions")}
          </span>
          {loading ? (
            <div className="h-8 w-16 bg-[#FAF9F6] border border-[#E8E5DF] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-display font-bold text-foreground">
              {stats?.totalContributions || 0}
            </p>
          )}
          <p className="text-xs text-text-muted">{t("contributionsDesc")}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
            {t("validations")}
          </span>
          {loading ? (
            <div className="h-8 w-16 bg-[#FAF9F6] border border-[#E8E5DF] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-display font-bold text-foreground">
              {stats?.totalValidations || 0}
            </p>
          )}
          <p className="text-xs text-text-muted">{t("validationsDesc")}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
            {t("wordsWon")}
          </span>
          {loading ? (
            <div className="h-8 w-16 bg-[#FAF9F6] border border-[#E8E5DF] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-display font-bold text-primary">
              {stats?.wordsWon?.length || 0}
            </p>
          )}
          <p className="text-xs text-text-muted">{t("wordsWonDesc")}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold font-display uppercase tracking-widest text-text-muted block">
            {t("avgScore")}
          </span>
          {loading ? (
            <div className="h-8 w-16 bg-[#FAF9F6] border border-[#E8E5DF] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-display font-bold text-foreground font-mono">
              {(stats?.avgScoreReceived || 0) > 0 ? `${stats!.avgScoreReceived.toFixed(1)}/5` : "—"}
            </p>
          )}
          <p className="text-xs text-text-muted">{t("avgScoreDesc")}</p>
        </div>
      </div>

      {/* Words Won Section */}
      {stats && stats.wordsWon.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
            {t("wordsWonTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stats.wordsWon.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-[#E8E5DF] bg-white hover:border-primary/40 transition-colors"
              >
                <p className="text-sm font-bold font-display text-foreground">{item.word}</p>
                {item.translation && (
                  <p className="text-xs text-text-muted truncate mt-0.5">{item.translation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
