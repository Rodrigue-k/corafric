"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Headphones,
  User,
  SearchX
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TeamUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string | null;
  role: string | null;
  total_contributions: number;
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
        throw new Error(errData.error || "Erreur de chargement des membres.");
      }
    } catch (err) {
      console.error("Error loading team data:", err);
      setFetchError(err instanceof Error ? err.message : "Erreur de connexion.");
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
        text: `Rôle de ${targetName} modifié : "${roleLabels[pendingChange.newRole] || pendingChange.newRole}".`,
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

  // Loading skeleton
  if (!isLoaded || (isLoading && teamUsers.length === 0 && !fetchError)) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-4 animate-pulse">
        <div className="h-8 w-48 bg-border/60 rounded-xl" />
        <div className="h-10 bg-white border border-border rounded-xl" />
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-border/30 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Unauthorized
  if (isSuperAdmin === false) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold font-display text-foreground mb-1">
          Accès Restreint
        </h1>
        <p className="text-text-muted text-xs mb-4">
          Réservé aux administrateurs de la plateforme.
        </p>
        <Link href="/">
          <Button variant="outline" size="sm">
            Accueil
          </Button>
        </Link>
      </div>
    );
  }

  // Error
  if (fetchError && teamUsers.length === 0) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
        <AlertCircle className="w-8 h-8 text-amber-600 mb-2" />
        <p className="text-xs text-text-muted mb-4">{fetchError}</p>
        <button
          onClick={fetchAdminData}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-xl cursor-pointer"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto py-2">
      {/* En-tête épuré */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
            Gestion des Rôles
          </h1>
          <p className="text-xs text-text-muted">
            Affectation des permissions et accès au studio.
          </p>
        </div>

        <button
          onClick={() => fetchAdminData()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-foreground bg-white border border-border rounded-xl transition cursor-pointer disabled:opacity-50"
          title="Actualiser la liste"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Notification de statut */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
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
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Barre de filtrage & recherche unifiée */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par nom ou email..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#FAF9F6] border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs overflow-x-auto">
          {[
            { id: "all", label: "Tous" },
            { id: "operator", label: "Opérateurs" },
            { id: "admin", label: "Admins" },
            { id: "contributor", label: "Contributeurs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === tab.id
                  ? "bg-foreground text-background"
                  : "bg-transparent text-text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau épuré des utilisateurs */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        {filteredUsers.length === 0 ? (
          <div className="py-12 px-4 text-center max-w-sm mx-auto flex flex-col items-center">
            <SearchX className="w-6 h-6 text-text-muted mb-2" />
            <p className="text-xs font-semibold text-foreground">Aucun membre trouvé</p>
            {(searchQuery || roleFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-foreground border border-border rounded-lg"
              >
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-border text-text-muted uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-semibold">Membre</th>
                  <th className="py-2.5 px-4 font-semibold">Email</th>
                  <th className="py-2.5 px-4 font-semibold">Rôle</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Modifier le Rôle</th>
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
                      {/* Nom */}
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs leading-tight">
                              {displayName}
                            </p>
                            {fullName && u.username && u.username !== fullName && (
                              <p className="text-[10px] text-text-muted font-mono leading-tight">
                                @{u.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-text-muted font-mono text-[11px]">
                        {u.email || <span className="text-text-muted/50 italic">Non renseigné</span>}
                      </td>

                      {/* Rôle actuel */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            role === "super_admin"
                              ? "bg-purple-100 text-purple-800"
                              : role === "admin"
                              ? "bg-red-100 text-red-800"
                              : role === "operator"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {role === "super_admin" && <Shield className="w-2.5 h-2.5 text-purple-600" />}
                          {role === "operator" && <Headphones className="w-2.5 h-2.5 text-amber-600" />}
                          {role === "admin" && <Shield className="w-2.5 h-2.5 text-red-600" />}
                          {role === "contributor" && <User className="w-2.5 h-2.5 text-slate-500" />}
                          {role === "super_admin"
                            ? "Super Admin"
                            : role === "operator"
                            ? "Opérateur Studio"
                            : role === "admin"
                            ? "Admin"
                            : "Contributeur"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {role === "super_admin" ? (
                          <span className="text-[10px] text-text-muted font-medium italic">
                            Verrouillé
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            {isRowUpdating && (
                              <RefreshCw className="w-3 h-3 animate-spin text-primary" />
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
                              className="text-xs bg-white border border-border rounded-lg px-2 py-1 text-foreground focus:border-primary outline-none cursor-pointer hover:border-primary/50 transition disabled:opacity-50"
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
        )}
      </div>

      {/* Modale de confirmation minimale */}
      {pendingChange && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-100"
          onClick={() => !isSubmitting && setPendingChange(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-border space-y-4 animate-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold font-display text-foreground text-sm">
                Confirmer l&apos;attribution
              </h3>
              <button
                onClick={() => setPendingChange(null)}
                disabled={isSubmitting}
                className="text-text-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Attribuer le rôle{" "}
              <strong className="text-foreground">
                {pendingChange.newRole === "operator"
                  ? "Opérateur Studio"
                  : pendingChange.newRole === "admin"
                  ? "Administrateur"
                  : "Contributeur"}
              </strong>{" "}
              à{" "}
              <strong className="text-foreground">
                {[pendingChange.user.firstName, pendingChange.user.lastName].filter(Boolean).join(" ") ||
                  pendingChange.user.username}
              </strong>
              {pendingChange.user.email ? ` (${pendingChange.user.email})` : ""}?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingChange(null)}
                disabled={isSubmitting}
                className="rounded-lg text-xs"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmRoleChange}
                disabled={isSubmitting}
                className="rounded-lg text-xs gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Application...</span>
                  </>
                ) : (
                  <span>Confirmer</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
