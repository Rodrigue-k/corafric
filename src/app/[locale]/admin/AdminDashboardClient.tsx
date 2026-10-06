"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  ShieldAlert,
  Mic,
  Grid,
  Sparkles,
  Users,
  RefreshCw,
  CheckCircle,
  Database,
  ArrowRight,
  UserCheck,
  Shield,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TeamUser {
  id: string;
  username: string;
  email: string | null;
  country: string | null;
  native_language: string | null;
  role: string | null;
  total_contributions: number;
  created_at: string;
}

interface AdminStats {
  totalWords: number;
  wordsWithAudio: number;
  totalRecordings: number;
  totalHours: number;
}

export function AdminDashboardClient() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      const checkRes = await fetch("/api/admin/check");
      const checkData = await checkRes.json();

      if (!checkData.isAdmin) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);

      // Fetch team & stats
      const [teamRes, statsRes] = await Promise.all([
        fetch("/api/admin/team"),
        fetch("/api/stats")
      ]);

      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamUsers(data.users || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({
          totalWords: data.totalWords || 0,
          wordsWithAudio: data.approvedRecordings || 0,
          totalRecordings: data.totalRecordings || 0,
          totalHours: data.totalHours || 0,
        });
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAdminData();
    } else if (isLoaded && !isSignedIn) {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchAdminData]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      setStatusMessage(null);
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");

      setTeamUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      setStatusMessage({
        text: `Rôle mis à jour avec succès : ${newRole.toUpperCase()}`,
        type: "success",
      });
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Erreur lors de la mise à jour",
        type: "error",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-text-muted text-sm font-medium">Chargement du portail d&apos;administration Corafric...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground mb-2">Accès Restreint</h1>
        <p className="text-text-muted text-sm mb-6 leading-relaxed">
          Cette section est strictement réservée au Super Administrateur et à l&apos;équipe de production Corafric.
        </p>
        <Link href="/">
          <Button variant="outline" size="sm">
            Retour à l&apos;accueil
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold font-display uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/20">
              Super Administration
            </span>
            <span className="text-xs text-text-muted">Gestion interne de la collecte et de l&apos;équipe</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight">
            Console de Contrôle Corafric
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Supervisez la production audio interne, gérez les droits des opérateurs et modérez le dictionnaire.
          </p>
        </div>

        <button
          onClick={() => fetchAdminData()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-foreground bg-white border border-border rounded-full hover:bg-black/5 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Quick Launch Cards for Internal Team Operations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Studio Opérateur */}
        <Link
          href="/studio"
          className="group p-6 rounded-2xl border border-border bg-white hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
              Studio Opérateur
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Interface haute cadence d&apos;enregistrement avec raccourcis clavier pour la production audio continue.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary pt-4 font-display">
            <span>Ouvrir le Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Feuille de Pistes Grille */}
        <Link
          href="/studio/grille"
          className="group p-6 rounded-2xl border border-border bg-white hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <Grid className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
              Feuille de Pistes
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Tableau exhaustif de tous les mots du dictionnaire avec statut d&apos;enregistrement et numérotation des pistes.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 pt-4 font-display">
            <span>Voir la Grille</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Modération des Suggestions */}
        <Link
          href="/admin/moderation"
          className="group p-6 rounded-2xl border border-border bg-white hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
              Modération Lexicale
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Examinez, validez ou rejetez les propositions de traduction et définitions soumises pour le dictionnaire.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 pt-4 font-display">
            <span>Modérer les Mots</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Team and Operator Management */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold font-display text-foreground">
              Gestion de l&apos;Équipe & des Opérateurs
            </h2>
          </div>
          <span className="text-xs text-text-muted">
            {teamUsers.length} comptes enregistrés
          </span>
        </div>

        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-border text-text-muted font-display uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Utilisateur</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Rôle Actuel</th>
                  <th className="py-3.5 px-4 font-semibold">Contributions</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Attribuer un Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {teamUsers.map((u) => {
                  const isSuperAdminEmail = u.email === "koudakporodrigue03@gmail.com";
                  const role = isSuperAdminEmail ? "super_admin" : (u.role || "contributor");
                  const isUpdating = updatingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {u.username ? u.username.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold">{u.username}</p>
                            <p className="text-[10px] text-text-muted font-mono">{u.id.substring(0, 12)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted font-mono text-[11px]">
                        {u.email || "—"}
                      </td>
                      <td className="py-3.5 px-4">
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
                          {role === "super_admin" && <Shield className="w-3 h-3" />}
                          {role === "admin" && <Shield className="w-3 h-3" />}
                          {role === "operator" && <Mic className="w-3 h-3" />}
                          {role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-semibold">
                        {u.total_contributions} audios
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSuperAdminEmail ? (
                          <span className="text-[11px] text-purple-700 font-bold italic">Super Admin (Fixe)</span>
                        ) : (
                          <select
                            value={role}
                            disabled={isUpdating}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="text-xs bg-white border border-border rounded-lg px-2.5 py-1 text-foreground focus:border-primary outline-none cursor-pointer"
                          >
                            <option value="contributor">Contributeur</option>
                            <option value="operator">Opérateur Studio</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
