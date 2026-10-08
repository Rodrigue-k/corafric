"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  ShieldAlert,
  Mic,
  Search,
  RefreshCw,
  CheckCircle,
  Shield,
  User,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
  Grid
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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
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
        throw new Error(errData.error || "Erreur de chargement des utilisateurs");
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
      setIsSuperAdmin(false);
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

  const confirmRoleChange = async () => {
    if (!pendingChange) return;

    try {
      setIsSubmitting(true);
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
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");

      setTeamUsers((prev) =>
        prev.map((u) =>
          u.id === pendingChange.user.id ? { ...u, role: pendingChange.newRole } : u
        )
      );

      setStatusMessage({
        text: `Rôle de ${pendingChange.user.firstName || pendingChange.user.username} mis à jour vers "${pendingChange.newRole === "operator" ? "Opérateur Studio" : pendingChange.newRole === "admin" ? "Administrateur" : "Contributeur"}". L'accès est actif immédiatement.`,
        type: "success",
      });

      setPendingChange(null);
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Erreur lors de la mise à jour",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-7 h-7 animate-spin text-primary" />
        <p className="text-text-muted text-xs font-medium">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold font-display text-foreground mb-2">Accès Restreint</h1>
        <p className="text-text-muted text-xs mb-6 leading-relaxed">
          Cette console est strictement réservée au Super Administrateur de la plateforme Corafric.
        </p>
        <Link href="/">
          <Button variant="outline" size="sm">
            Retour à l&apos;accueil
          </Button>
        </Link>
      </div>
    );
  }

  const operatorCount = teamUsers.filter((u) => u.role === "operator").length;
  const adminCount = teamUsers.filter((u) => u.role === "admin" || u.email === "koudakporodrigue03@gmail.com").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header & Quick Links Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-border/70 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold font-display uppercase tracking-wider rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Super Admin
            </span>
            <span className="text-xs text-text-muted">Console de gestion des accès</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
            Gestion des Utilisateurs & Rôles
          </h1>
        </div>

        {/* Minimal Navigation Shortcuts & Refresh */}
        <div className="flex items-center flex-wrap gap-2">
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Studio Opérateur</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
          <Link
            href="/studio/grille"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 transition-colors"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Feuille de Pistes</span>
          </Link>
          <Link
            href="/admin/moderation"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modération</span>
          </Link>
          <button
            onClick={() => fetchAdminData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-white border border-border rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Search & Role Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-border">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par prénom, nom ou email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleFilter === "all"
                ? "bg-foreground text-background"
                : "bg-black/5 text-text-muted hover:text-foreground"
            }`}
          >
            Tous ({teamUsers.length})
          </button>
          <button
            onClick={() => setRoleFilter("operator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleFilter === "operator"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Opérateurs ({operatorCount})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleFilter === "admin"
                ? "bg-purple-600 text-white"
                : "bg-purple-50 text-purple-800 hover:bg-purple-100"
            }`}
          >
            Admins ({adminCount})
          </button>
          <button
            onClick={() => setRoleFilter("contributor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleFilter === "contributor"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Contributeurs
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-border text-text-muted font-display uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Nom & Prénom</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Rôle Actuel</th>
                <th className="py-3 px-4 font-semibold">Contributions</th>
                <th className="py-3 px-4 font-semibold text-right">Action / Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-text-muted">
                    Aucun utilisateur ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuperAdmin =
                    u.role === "super_admin" ||
                    u.email === "koudakporodrigue03@gmail.com" ||
                    u.email === "gabirusamaa@gmail.com";
                  const role = isSuperAdmin ? "super_admin" : (u.role || "contributor");
                  const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
                  const displayName = fullName || u.username || "Utilisateur";

                  return (
                    <tr key={u.id} className="hover:bg-black/[0.01] transition-colors">
                      {/* Name & Username */}
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {displayName}
                            </p>
                            {fullName && u.username && u.username !== fullName && (
                              <p className="text-[10px] text-text-muted">@{u.username}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-text-muted font-mono text-[11px]">
                        {u.email ? (
                          <span className="text-foreground">{u.email}</span>
                        ) : (
                          <span className="text-text-muted italic">Non renseigné</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            role === "super_admin"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : role === "admin"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : role === "operator"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {role === "super_admin" && <Shield className="w-3 h-3 text-purple-600" />}
                          {role === "admin" && <Shield className="w-3 h-3 text-red-600" />}
                          {role === "operator" && <Mic className="w-3 h-3 text-amber-600" />}
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
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {u.total_contributions > 0 ? (
                          <span>{u.total_contributions} audios</span>
                        ) : (
                          <span className="text-text-muted font-normal text-[11px]">0</span>
                        )}
                      </td>

                      {/* Action Dropdown with Confirmation Trigger */}
                      <td className="py-3 px-4 text-right">
                        {role === "super_admin" ? (
                          <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                            Super Admin (Verrouillé)
                          </span>
                        ) : (
                          <select
                            value={role}
                            onChange={(e) => {
                              const nextRole = e.target.value as "contributor" | "operator" | "admin";
                              if (nextRole !== role) {
                                setPendingChange({ user: u, newRole: nextRole });
                              }
                            }}
                            className="text-xs bg-white border border-border rounded-lg px-2.5 py-1 text-foreground focus:border-primary outline-none cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <option value="contributor">Contributeur</option>
                            <option value="operator">Opérateur Studio</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-bold font-display text-foreground text-base">
                  Confirmer la modification du rôle
                </h3>
              </div>
              <button
                onClick={() => setPendingChange(null)}
                disabled={isSubmitting}
                className="text-text-muted hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-text-muted">
              <p>
                Vous êtes sur le point d&apos;attribuer le rôle{" "}
                <span className="font-bold text-foreground underline uppercase">
                  {pendingChange.newRole === "operator"
                    ? "Opérateur Studio"
                    : pendingChange.newRole === "admin"
                    ? "Administrateur"
                    : "Contributeur"}
                </span>{" "}
                à l&apos;utilisateur :
              </p>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-border space-y-1">
                <p className="font-bold text-foreground text-sm">
                  {[pendingChange.user.firstName, pendingChange.user.lastName].filter(Boolean).join(" ") || pendingChange.user.username}
                </p>
                <p className="font-mono text-text-muted text-[11px]">
                  {pendingChange.user.email || "Email non renseigné"}
                </p>
              </div>

              {pendingChange.newRole === "operator" && (
                <div className="p-2.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] leading-relaxed">
                  ✓ Cet utilisateur aura immédiatement accès à l&apos;interface interne <strong>Studio d&apos;enregistrement</strong> (/studio) dès sa prochaine actualisation.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingChange(null)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmRoleChange}
                disabled={isSubmitting}
                className="gap-1.5"
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
