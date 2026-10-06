import React from "react";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/admin";
import { StudioGrilleClient } from "./StudioGrilleClient";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Feuille de Pistes Studio — Dictionnaire Vocabulaire Éwé",
  description: "Grille d'enregistrement séquentielle pour le studio d'enregistrement et la numérotation des pistes audio.",
};

export default async function StudioGrillePage() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4 py-16">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground mb-2">Accès Réservé à l&apos;Équipe</h1>
        <p className="text-text-muted text-sm mb-6 leading-relaxed">
          La feuille de pistes studio est un outil interne de coordination réservé aux opérateurs et linguistes Corafric.
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
    <div className="min-h-[calc(100vh-140px)] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <StudioGrilleClient />
    </div>
  );
}
