"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  MessageSquare, 
  User, 
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Suggestion {
  id: string;
  word_id: string;
  user_id: string;
  user_display_name: string;
  suggested_fr: string | null;
  suggested_en: string | null;
  suggested_def: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  word_ewe: string;
  current_fr: string | null;
  current_en: string | null;
  current_def: string | null;
}

export default function AdminModerationPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsUnauthorized(false);
      const res = await fetch(`/api/admin/suggestions?status=${filterStatus}`);
      if (res.status === 403 || res.status === 401) {
        setIsUnauthorized(true);
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchSuggestions();
    }
  }, [isLoaded, isSignedIn, fetchSuggestions]);

  const handleAction = async (suggestionId: string, action: "approve" | "reject") => {
    try {
      setProcessingId(suggestionId);
      setActionMessage(null);
      const res = await fetch("/api/admin/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setActionMessage({
        text: action === "approve" ? "Proposition approuvée et intégrée au dictionnaire !" : "Proposition rejetée.",
        type: "success",
      });

      // Update state locally for snappy UX
      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestionId ? { ...s, status: action === "approve" ? "approved" : "rejected" } : s))
      );

      // If viewing pending only, remove it from list
      if (filterStatus === "pending") {
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      }
    } catch (err: unknown) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Erreur lors du traitement.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (!isLoaded || (isLoading && suggestions.length === 0 && !isUnauthorized)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-terracotta-500" />
        <p className="text-earth-600 text-sm font-medium">Chargement du centre de modération...</p>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-serif font-bold text-earth-900 mb-2">Accès Administrateur Restreint</h1>
        <p className="text-earth-600 text-sm mb-6 leading-relaxed">
          Cette section est strictement réservée à l&apos;équipe de modération de Corafric. Votre compte actuel ne dispose pas des privilèges requis.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-earth-700 bg-white border border-earth-200 rounded-full hover:bg-earth-50 transition-colors shadow-xs"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-earth-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-terracotta-100 text-terracotta-700">
              Back-Office
            </span>
            <span className="text-xs text-earth-500">Sécurité et Qualité</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900">
            Modération des Suggestions
          </h1>
          <p className="text-sm text-earth-600 mt-1">
            Validez ou rejetez les propositions de traduction soumises par la communauté.
          </p>
        </div>

        <button
          onClick={() => fetchSuggestions()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-earth-700 bg-white border border-earth-200 rounded-lg hover:bg-earth-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm flex items-center justify-between transition-all ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-medium ml-4"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
        {(
          [
            { id: "pending", label: "En attente", icon: Clock },
            { id: "approved", label: "Approuvées", icon: CheckCircle2 },
            { id: "rejected", label: "Rejetées", icon: XCircle },
            { id: "all", label: "Toutes", icon: BookOpen },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-terracotta-600 text-white shadow-sm"
                  : "bg-earth-100 text-earth-600 hover:bg-earth-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "pending" && pendingCount > 0 && filterStatus === "pending" && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List of Suggestions */}
      <div className="mt-6 space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-16 bg-white border border-earth-200/80 rounded-xl p-8">
            <Sparkles className="w-10 h-10 text-terracotta-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-serif font-semibold text-earth-900 mb-1">
              Aucune proposition dans cet onglet
            </h3>
            <p className="text-xs text-earth-500 max-w-sm mx-auto">
              Toutes les propositions communautaires ont été traitées ou aucune suggestion ne correspond à ce filtre.
            </p>
          </div>
        ) : (
          suggestions.map((item) => {
            const isProcessing = processingId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white border border-earth-200/90 rounded-xl p-5 shadow-xs hover:border-earth-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-earth-100">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-serif font-bold text-earth-950">
                      {item.word_ewe}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-earth-100 text-earth-700 font-mono">
                      Éwé
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-earth-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-earth-400" />
                      {item.user_display_name || "Contributeur anonyme"}
                    </span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString("fr-FR")}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : item.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status === "pending"
                        ? "En attente"
                        : item.status === "approved"
                        ? "Approuvée"
                        : "Rejetée"}
                    </span>
                  </div>
                </div>

                {/* Comparison content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  {/* Current version */}
                  <div className="bg-earth-50/60 rounded-lg p-3 border border-earth-100 text-xs space-y-2">
                    <div className="font-semibold text-earth-500 uppercase tracking-wider text-[10px]">
                      Version Actuelle dans le Dictionnaire
                    </div>
                    <div>
                      <span className="text-earth-400 font-medium">Français : </span>
                      <span className="text-earth-800 font-medium">
                        {item.current_fr || <em className="text-earth-400">Aucune traduction</em>}
                      </span>
                    </div>
                    <div>
                      <span className="text-earth-400 font-medium">Anglais : </span>
                      <span className="text-earth-800">
                        {item.current_en || <em className="text-earth-400">Non renseigné</em>}
                      </span>
                    </div>
                    {item.current_def && (
                      <div>
                        <span className="text-earth-400 font-medium">Définition : </span>
                        <span className="text-earth-700">{item.current_def}</span>
                      </div>
                    )}
                  </div>

                  {/* Proposed version */}
                  <div className="bg-terracotta-50/40 rounded-lg p-3 border border-terracotta-100/70 text-xs space-y-2">
                    <div className="font-semibold text-terracotta-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-terracotta-500" />
                      Proposition de la Communauté
                    </div>
                    <div>
                      <span className="text-terracotta-600/80 font-medium">Français proposé : </span>
                      <span className="text-earth-900 font-semibold">
                        {item.suggested_fr || <em className="text-earth-400">Non modifié</em>}
                      </span>
                    </div>
                    <div>
                      <span className="text-terracotta-600/80 font-medium">Anglais proposé : </span>
                      <span className="text-earth-800">
                        {item.suggested_en || <em className="text-earth-400">Non renseigné</em>}
                      </span>
                    </div>
                    {item.suggested_def && (
                      <div>
                        <span className="text-terracotta-600/80 font-medium">Définition proposée : </span>
                        <span className="text-earth-800">{item.suggested_def}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="pt-1 border-t border-terracotta-100/60 flex items-start gap-1 text-[11px] text-earth-600 italic">
                        <MessageSquare className="w-3 h-3 text-terracotta-400 shrink-0 mt-0.5" />
                        <span>&quot;{item.notes}&quot;</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {item.status === "pending" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-earth-100">
                    <button
                      onClick={() => handleAction(item.id, "reject")}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? "Traitement..." : "Rejeter"}
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "approve")}
                      disabled={isProcessing}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-terracotta-600 hover:bg-terracotta-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>Approuver et fusionner</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
