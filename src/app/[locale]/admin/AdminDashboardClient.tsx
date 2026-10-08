"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  ShieldAlert,
  Mic,
  Search,
  RefreshCw,
  CheckCircle2,
  Shield,
  User,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
  Grid,
  SearchX,
  Users,
  ChevronRight,
  Headphones,
  Check,
  Music
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TeamUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string | null;
  country?: string | null;
  role: string | null;
  total_contributions: number;
  created_at: string;
}

interface PendingRoleChange {
  user: TeamUser;
  newRole: "contributor" | "operator" | "admin";
}

export function AdminDashboardClient() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

      const checkRes = await fetch("/api/admin/check");
      const checkData = await checkRes.json();

      if (!checkData.isSuperAdmin) {
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsSuperAdmin(true);

      const teamRes = await fetch("/api/admin/team");
      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamUsers(data.users || []);
      } else {
        const errData = await teamRes.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la récupération des membres.");
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
      setFetchError(err instanceof Error ? err.message : "Erreur réseau.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAdminData();
    } else if (isLoaded && !isSignedIn) {
      setIsSuperAdmin(false);
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchAdminData]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pendingChange && !isSubmitting) {
        setPendingChange(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingChange, isSubmitting]);

  const confirmRoleChange = async () => {
    if (!pendingChange) return;

    try {
      setIsSubmitting(true);
      setUpdatingUserId(pendingChange.user.id);
      setStatusMessage(null);

      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: pendingChange.user.id,
          newRole: pendingChange.newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour du rôle.");

      setTeamUsers((prev) =>
        prev.map((u) =>
          u.id === pendingChange.user.id ? { ...u, role: pendingChange.newRole } : u
        )
      );

      const roleLabels: Record<string, string> = {
        operator: "Opérateur Studio",
        admin: "Administrateur",
        contributor: "Contributeur",
      };

      const targetName =
        [pendingChange.user.firstName, pendingChange.user.lastName].filter(Boolean).join(" ") ||
        pendingChange.user.username;

      setStatusMessage({
        text: `Privilèges de ${targetName} mis à jour avec succès : "${roleLabels[pendingChange.newRole] || pendingChange.newRole}".`,
        type: "success",
      });

      setPendingChange(null);
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Erreur lors de la mise à jour.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
      setUpdatingUserId(null);
    }
  };

  // Metric Computations
  const stats = useMemo(() => {
    const total = teamUsers.length;
    let superAdmins = 0;
    let operators = 0;
    let admins = 0;
    let contributors = 0;

    teamUsers.forEach((u) => {
      const isSuperAdminEmail =
        u.role === "super_admin" ||
        u.email === "koudakporodrigue03@gmail.com" ||
        u.email === "gabirusamaa@gmail.com";

      if (isSuperAdminEmail) {
        superAdmins += 1;
      } else if (u.role === "operator") {
        operators += 1;
      } else if (u.role === "admin") {
        admins += 1;
      } else {
        contributors += 1;
      }
    });

    return { total, superAdmins, operators, admins, contributors };
  }, [teamUsers]);

  const filteredUsers = useMemo(() => {
    return teamUsers.filter((u) => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const username = (u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchesQuery =
        !query ||
        fullName.includes(query) ||
        username.includes(query) ||
        email.includes(query);

      const isSuperAdmin =
        u.role === "super_admin" ||
        u.email === "koudakporodrigue03@gmail.com" ||
        u.email === "gabirusamaa@gmail.com";
      const actualRole = isSuperAdmin ? "super_admin" : (u.role || "contributor");

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "operator" && actualRole === "operator") ||
        (roleFilter === "admin" && (actualRole === "admin" || actualRole === "super_admin")) ||
        (roleFilter === "contributor" && actualRole === "contributor");

      return matchesQuery && matchesRole;
    });
  }, [teamUsers, searchQuery, roleFilter]);

  // 1. Loading State: Full Skeleton
  if (!isLoaded || (isLoading && teamUsers.length === 0 && !fetchError)) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-4 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-border/60 rounded-full" />
            <div className="h-8 w-64 bg-border/80 rounded-xl" />
            <div className="h-4 w-96 bg-border/50 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-border/60 rounded-xl" />
            <div className="h-9 w-28 bg-border/60 rounded-xl" />
          </div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white border border-border rounded-2xl p-4" />
          ))}
        </div>

        {/* Filter Bar Skeleton */}
        <div className="h-12 bg-white border border-border rounded-2xl" />

        {/* Table Rows Skeleton */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-border/30 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Unauthorized State
  if (isSuperAdmin === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mb-4 shadow-2xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold font-display text-foreground mb-2">
          Accès Restreint
        </h1>
        <p className="text-text-muted text-xs mb-6 leading-relaxed max-w-sm">
          Cette console est strictement réservée au Super Administrateur de la plateforme Corafric.
        </p>
        <Link href="/">
          <Button variant="outline" size="sm" className="rounded-xl">
            Retour à l&apos;accueil
          </Button>
        </Link>
      </div>
    );
  }

  // 3. Error State
  if (fetchError && teamUsers.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold font-display text-foreground mb-2">
          Synchronisation Impossible
        </h2>
        <p className="text-text-muted text-xs mb-6 leading-relaxed">
          {fetchError}
        </p>
        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Réessayer le chargement</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Sovereign Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-border/80 gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold font-display uppercase tracking-wider rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              <Shield className="w-3 h-3 text-purple-600" />
              Super Administration
            </span>
            <span className="text-xs text-text-muted">Console Souveraine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
            Équipe & Droits d&apos;Accès
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-xl">
            Gestion centralisée des rôles, affectation des opérateurs studio et supervision des contributeurs.
          </p>
        </div>

        {/* Sovereign Tool Navigation */}
        <div className="flex items-center flex-wrap gap-2">
          <Link
            href="/studio/matcher"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF9F6] border border-border text-foreground transition shadow-2xs"
            title="Associer manuellement les enregistrements studio"
          >
            <Music className="w-3.5 h-3.5 text-primary" />
            <span>Audio Matcher</span>
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF9F6] border border-border text-foreground transition shadow-2xs"
          >
            <Mic className="w-3.5 h-3.5 text-primary" />
            <span>Studio</span>
            <ExternalLink className="w-3 h-3 text-text-muted" />
          </Link>
          <Link
            href="/studio/grille"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF9F6] border border-border text-foreground transition shadow-2xs"
          >
            <Grid className="w-3.5 h-3.5 text-amber-600" />
            <span>Pistes</span>
          </Link>
          <Link
            href="/admin/moderation"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF9F6] border border-border text-foreground transition shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Modération</span>
          </Link>
          <button
            onClick={() => fetchAdminData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text-muted hover:text-foreground bg-white border border-border rounded-xl hover:bg-[#FAF9F6] transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Rafraîchir la liste des membres"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total Membres
            </p>
            <p className="text-2xl font-bold font-display text-foreground mt-0.5">
              {stats.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-border flex items-center justify-center text-text-muted">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Opérateurs Studio
            </p>
            <p className="text-2xl font-bold font-display text-foreground mt-0.5">
              {stats.operators}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
              Super Admins
            </p>
            <p className="text-2xl font-bold font-display text-foreground mt-0.5">
              {stats.superAdmins}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Contributeurs
            </p>
            <p className="text-2xl font-bold font-display text-foreground mt-0.5">
              {stats.contributors}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-border flex items-center justify-center text-text-muted">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between transition-all shadow-2xs animate-in fade-in slide-in-from-top-1 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Search & Role Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-2xs">
        {/* Search input with clear button */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par prénom, nom ou email..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#FAF9F6] border border-border rounded-xl text-foreground placeholder:text-text-muted/60 focus:outline-none focus:border-primary transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              roleFilter === "all"
                ? "bg-foreground text-background shadow-2xs"
                : "bg-[#FAF9F6] text-text-muted hover:text-foreground border border-border/60"
            }`}
          >
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setRoleFilter("operator")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              roleFilter === "operator"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50/70 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
            }`}
          >
            Opérateurs ({stats.operators})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              roleFilter === "admin"
                ? "bg-purple-700 text-white shadow-2xs"
                : "bg-purple-50/70 text-purple-800 hover:bg-purple-100 border border-purple-200/60"
            }`}
          >
            Admins ({stats.superAdmins + stats.admins})
          </button>
          <button
            onClick={() => setRoleFilter("contributor")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              roleFilter === "contributor"
                ? "bg-slate-700 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
            }`}
          >
            Contributeurs ({stats.contributors})
          </button>
        </div>
      </div>

      {/* Users Content Container */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-2xs">
        {filteredUsers.length === 0 ? (
          /* 4-State UI: Empty State */
          <div className="py-16 px-4 text-center max-w-sm mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-border flex items-center justify-center text-text-muted mb-3">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground mb-1">
              Aucun membre trouvé
            </h3>
            <p className="text-xs text-text-muted mb-5 leading-relaxed">
              Aucun membre ne correspond aux critères de recherche ou au filtre de rôle sélectionné.
            </p>
            {(searchQuery || roleFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#FAF9F6] hover:bg-[#F0EEEA] border border-border text-foreground rounded-xl transition cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-border text-text-muted font-display uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5 font-semibold">Membre</th>
                    <th className="py-3 px-5 font-semibold">Email</th>
                    <th className="py-3 px-5 font-semibold">Rôle Actuel</th>
                    <th className="py-3 px-5 font-semibold">Contributions</th>
                    <th className="py-3 px-5 font-semibold text-right">Attribution du Rôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((u) => {
                    const isSuperAdmin =
                      u.role === "super_admin" ||
                      u.email === "koudakporodrigue03@gmail.com" ||
                      u.email === "gabirusamaa@gmail.com";
                    const role = isSuperAdmin ? "super_admin" : (u.role || "contributor");
                    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
                    const displayName = fullName || u.username || "Utilisateur";
                    const isRowUpdating = updatingUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-5 font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-2xs">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">
                                {displayName}
                              </p>
                              {fullName && u.username && u.username !== fullName && (
                                <p className="text-[10px] text-text-muted font-mono">@{u.username}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-5 text-text-muted font-mono text-[11px]">
                          {u.email ? (
                            <span className="text-foreground">{u.email}</span>
                          ) : (
                            <span className="text-text-muted/60 italic">Non renseigné</span>
                          )}
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              role === "super_admin"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : role === "admin"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : role === "operator"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {role === "super_admin" && <Shield className="w-3 h-3 text-purple-600" />}
                            {role === "admin" && <Shield className="w-3 h-3 text-red-600" />}
                            {role === "operator" && <Headphones className="w-3 h-3 text-amber-600" />}
                            {role === "contributor" && <User className="w-3 h-3 text-slate-500" />}
                            {role === "super_admin"
                              ? "Super Admin"
                              : role === "operator"
                              ? "Opérateur Studio"
                              : role === "admin"
                              ? "Administrateur"
                              : "Contributeur"}
                          </span>
                        </td>

                        {/* Contributions */}
                        <td className="py-3.5 px-5 text-foreground font-semibold">
                          {u.total_contributions > 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {u.total_contributions} audios
                            </span>
                          ) : (
                            <span className="text-text-muted/70 font-normal text-[11px]">0 audio</span>
                          )}
                        </td>

                        {/* Action Dropdown */}
                        <td className="py-3.5 px-5 text-right">
                          {role === "super_admin" ? (
                            <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                              Super Admin (Verrouillé)
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              {isRowUpdating && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                              )}
                              <select
                                value={role}
                                disabled={isRowUpdating}
                                onChange={(e) => {
                                  const nextRole = e.target.value as "contributor" | "operator" | "admin";
                                  if (nextRole !== role) {
                                    setPendingChange({ user: u, newRole: nextRole });
                                  }
                                }}
                                className="text-xs bg-white border border-border rounded-xl px-3 py-1.5 text-foreground focus:border-primary outline-none cursor-pointer hover:border-primary/50 transition shadow-2xs disabled:opacity-50"
                              >
                                <option value="contributor">Contributeur</option>
                                <option value="operator">Opérateur Studio</option>
                                <option value="admin">Administrateur</option>
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="md:hidden divide-y divide-border/60">
              {filteredUsers.map((u) => {
                const isSuperAdmin =
                  u.role === "super_admin" ||
                  u.email === "koudakporodrigue03@gmail.com" ||
                  u.email === "gabirusamaa@gmail.com";
                const role = isSuperAdmin ? "super_admin" : (u.role || "contributor");
                const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
                const displayName = fullName || u.username || "Utilisateur";
                const isRowUpdating = updatingUserId === u.id;

                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-text-muted font-mono truncate">
                            {u.email || "Email non renseigné"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          role === "super_admin"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : role === "admin"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : role === "operator"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {role === "super_admin"
                          ? "Super Admin"
                          : role === "operator"
                          ? "Opérateur"
                          : role === "admin"
                          ? "Admin"
                          : "Contributeur"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <span className="text-text-muted">
                        Contributions : <strong className="text-foreground">{u.total_contributions} audios</strong>
                      </span>

                      {role === "super_admin" ? (
                        <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                          Verrouillé
                        </span>
                      ) : (
                        <select
                          value={role}
                          disabled={isRowUpdating}
                          onChange={(e) => {
                            const nextRole = e.target.value as "contributor" | "operator" | "admin";
                            if (nextRole !== role) {
                              setPendingChange({ user: u, newRole: nextRole });
                            }
                          }}
                          className="text-xs bg-[#FAF9F6] border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:border-primary outline-none cursor-pointer"
                        >
                          <option value="contributor">Contributeur</option>
                          <option value="operator">Opérateur Studio</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {pendingChange && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => !isSubmitting && setPendingChange(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-border space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-foreground text-base">
                    Confirmer le Privilège
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Modification des permissions de l&apos;utilisateur
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingChange(null)}
                disabled={isSubmitting}
                className="text-text-muted hover:text-foreground p-1.5 rounded-xl hover:bg-[#FAF9F6] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Info */}
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-border space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Membre Cible
                </p>
                <p className="font-bold text-foreground text-sm">
                  {[pendingChange.user.firstName, pendingChange.user.lastName].filter(Boolean).join(" ") ||
                    pendingChange.user.username}
                </p>
                <p className="font-mono text-text-muted text-[11px]">
                  {pendingChange.user.email || "Email non renseigné"}
                </p>
              </div>

              {/* Role Transition Comparison */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-white shadow-2xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                    Rôle Actuel
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold uppercase">
                    {pendingChange.user.role || "Contributeur"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
                <div className="space-y-0.5 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                    Nouveau Rôle
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-primary text-white text-[11px] font-bold uppercase shadow-2xs">
                    {pendingChange.newRole === "operator"
                      ? "Opérateur Studio"
                      : pendingChange.newRole === "admin"
                      ? "Administrateur"
                      : "Contributeur"}
                  </span>
                </div>
              </div>

              {/* Contextual Access Explanation */}
              {pendingChange.newRole === "operator" && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl text-[11px] leading-relaxed flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Cet utilisateur aura immédiatement accès à l&apos;interface du <strong>Studio d&apos;enregistrement</strong>, à la <strong>Feuille de pistes</strong> et à l&apos;outil <strong>Audio Matcher</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingChange(null)}
                disabled={isSubmitting}
                className="rounded-xl px-4"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmRoleChange}
                disabled={isSubmitting}
                className="gap-2 rounded-xl px-5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Application...</span>
                  </>
                ) : (
                  <span>Confirmer le rôle</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
