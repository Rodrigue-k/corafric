"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Headphones,
  User,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";

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
      <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 animate-pulse">
        <div className="h-16 bg-white border border-[#E8E5DF] rounded-xl" />
        <div className="h-12 bg-white border border-[#E8E5DF] rounded-xl" />
        <div className="bg-white border border-[#E8E5DF] rounded-xl p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-11 bg-[#FAF9F6] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Unauthorized
  if (isSuperAdmin === false) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
        <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3 border border-red-200">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h1 className="text-base font-bold font-display text-[#141416] mb-1">
          Accès Restreint
        </h1>
        <p className="text-[#68645E] text-xs mb-4">
          Réservé aux administrateurs de la plateforme Corafric.
        </p>
        <Link href="/">
          <Button variant="outline" size="sm" className="rounded-lg text-xs">
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
        <p className="text-xs text-[#68645E] mb-4">{fetchError}</p>
        <button
          onClick={fetchAdminData}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B84A2A] hover:bg-[#A03E22] rounded-lg cursor-pointer transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto px-2 sm:px-4 pb-12">
      {/* ─── Top Admin Bar (Matching Studio Identity) ─── */}
      <div className="bg-white border border-[#E8E5DF] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F9EBE6] text-[#B84A2A] flex items-center justify-center font-bold shrink-0 border border-[#F2D7CE]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-base sm:text-lg text-[#141416] tracking-tight font-display">
                Gestion des Rôles & Accès Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#F9EBE6] text-[#B84A2A] border border-[#F2D7CE]">
                {teamUsers.length} Membres
              </span>
            </div>
            <p className="text-xs text-[#68645E] mt-0.5">
              Affectation des rôles et contrôle des permissions pour la plateforme et le studio.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAdminData()}
          disabled={isLoading}
          className="px-3 py-2 rounded-lg bg-[#FAF9F6] hover:bg-[#F0EEEA] border border-[#E8E5DF] text-[#141416] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          title="Actualiser la liste des membres"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B84A2A] ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* ─── Status Notification Banner ─── */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
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
            aria-label="Fermer la notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Modular Controls Bar (Search + Segmented Tabs) ─── */}
      <div className="bg-white border border-[#E8E5DF] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Reusable Studio Search Bar */}
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher nom, username, email..."
          />
        </div>

        {/* Filter Pills Matching Studio Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <div className="flex bg-[#FAF9F6] p-1 rounded-lg border border-[#E8E5DF] text-xs w-full sm:w-auto">
            {[
              { id: "all", label: `Tous (${teamUsers.length})` },
              { id: "operator", label: "Opérateurs" },
              { id: "admin", label: "Admins" },
              { id: "contributor", label: "Contributeurs" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-semibold transition text-center whitespace-nowrap cursor-pointer ${
                  roleFilter === tab.id
                    ? "bg-white text-[#B84A2A] font-bold shadow-2xs border border-[#E8E5DF]/70"
                    : "text-[#68645E] hover:text-[#141416]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Members Table (Studio Table Identity & Mobile Ergonomics) ─── */}
      <div className="bg-white border border-[#E8E5DF] rounded-xl overflow-hidden shadow-2xs">
        {filteredUsers.length === 0 ? (
          <div className="py-14 px-4 text-center max-w-sm mx-auto flex flex-col items-center">
            <SearchX className="w-6 h-6 text-[#68645E] mb-2" />
            <p className="text-xs font-semibold text-[#141416]">Aucun membre trouvé</p>
            {(searchQuery || roleFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#68645E] hover:text-[#141416] border border-[#E8E5DF] rounded-lg bg-[#FAF9F6] hover:bg-[#F0EEEA] transition"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-full">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E8E5DF] text-[#68645E] uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Membre</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Email</th>
                  <th className="py-3 px-4">Rôle</th>
                  <th className="py-3 px-4 text-right">Modifier le Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DF]/60">
                {filteredUsers.map((u) => {
                  const isUserSuperAdmin =
                    u.role === "super_admin" ||
                    u.email === "koudakporodrigue03@gmail.com" ||
                    u.email === "gabirusamaa@gmail.com";
                  const role = isUserSuperAdmin ? "super_admin" : (u.role || "contributor");
                  const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
                  const displayName = fullName || u.username || "Utilisateur";
                  const isRowUpdating = updatingUserId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#FAF9F6]/60 transition-colors"
                    >
                      {/* Membre + Email contextuel sur mobile */}
                      <td className="py-3.5 px-4 font-medium text-[#141416]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F9EBE6] border border-[#F2D7CE] flex items-center justify-center text-[#B84A2A] font-bold text-xs shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#141416] text-xs leading-tight truncate">
                              {displayName}
                            </p>
                            {fullName && u.username && u.username !== fullName && (
                              <p className="text-[10px] text-[#68645E] font-mono leading-tight truncate">
                                @{u.username}
                              </p>
                            )}
                            {/* Sur mobile : affichage inline de l'email sous le nom pour fluidifier la vue sans scroll obligatoire */}
                            {u.email && (
                              <p className="sm:hidden text-[10px] text-[#68645E] font-mono truncate max-w-[140px] mt-0.5">
                                {u.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email (Desktop) */}
                      <td className="py-3.5 px-4 text-[#68645E] font-mono text-xs hidden sm:table-cell">
                        {u.email || <span className="text-[#68645E]/50 italic">Non renseigné</span>}
                      </td>

                      {/* Rôle actuel (Identité Corafric) */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            role === "super_admin"
                              ? "bg-[#F9EBE6] text-[#B84A2A] border border-[#F2D7CE]"
                              : role === "operator"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : role === "admin"
                              ? "bg-[#F9EBE6] text-[#B84A2A] border border-[#F2D7CE]"
                              : "bg-[#FAF9F6] text-[#68645E] border border-[#E8E5DF]"
                          }`}
                        >
                          {role === "super_admin" && <Shield className="w-3 h-3 text-[#B84A2A]" />}
                          {role === "operator" && <Headphones className="w-3 h-3 text-amber-600" />}
                          {role === "admin" && <Shield className="w-3 h-3 text-[#B84A2A]" />}
                          {role === "contributor" && <User className="w-3 h-3 text-[#68645E]" />}
                          {role === "super_admin"
                            ? "Super Admin"
                            : role === "operator"
                            ? "Opérateur Studio"
                            : role === "admin"
                            ? "Admin"
                            : "Contributeur"}
                        </span>
                      </td>

                      {/* Action sélecteur */}
                      <td className="py-3.5 px-4 text-right">
                        {isUserSuperAdmin ? (
                          <span className="text-[11px] text-[#68645E] font-medium italic">
                            Verrouillé
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            {isRowUpdating && (
                              <RefreshCw className="w-3 h-3 animate-spin text-[#B84A2A]" />
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
                              className="text-xs bg-white border border-[#E8E5DF] rounded-lg px-2.5 py-1.5 text-[#141416] focus:border-[#B84A2A] focus:outline-none cursor-pointer hover:border-[#B84A2A]/60 transition disabled:opacity-50"
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

      {/* ─── Modale de Confirmation (Crisp, Rounded-xl, Corafric Identity) ─── */}
      {pendingChange && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-100"
          onClick={() => !isSubmitting && setPendingChange(null)}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-lg border border-[#E8E5DF] space-y-4 animate-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E5DF]">
              <h3 className="font-bold font-display text-[#141416] text-sm">
                Confirmer l&apos;attribution
              </h3>
              <button
                onClick={() => setPendingChange(null)}
                disabled={isSubmitting}
                className="text-[#68645E] hover:text-[#141416] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#68645E] leading-relaxed">
              Attribuer le rôle{" "}
              <strong className="text-[#141416]">
                {pendingChange.newRole === "operator"
                  ? "Opérateur Studio"
                  : pendingChange.newRole === "admin"
                  ? "Administrateur"
                  : "Contributeur"}
              </strong>{" "}
              à{" "}
              <strong className="text-[#141416]">
                {[pendingChange.user.firstName, pendingChange.user.lastName].filter(Boolean).join(" ") ||
                  pendingChange.user.username}
              </strong>
              {pendingChange.user.email ? ` (${pendingChange.user.email})` : ""}?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E5DF]">
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
