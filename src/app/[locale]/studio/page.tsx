import React from "react";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/admin";
import { StudioClientPage } from "./StudioClientPage";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Studio Opérateur et Collecte Intensive — Corafric",
  description: "Interface interne haute cadence pour l'enregistrement et le contrôle qualité du dictionnaire audio.",
};

export default async function StudioPage() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4 py-16">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground mb-2">Accès Réservé à l&apos;Équipe</h1>
        <p className="text-text-muted text-sm mb-6 leading-relaxed">
          Le Studio d&apos;enregistrement est un outil interne réservé aux opérateurs et linguistes autorisés par l&apos;administrateur.
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
    <div className="min-h-[calc(100vh-140px)] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 flex flex-col justify-start max-w-7xl mx-auto w-full">
      <StudioClientPage />
    </div>
  );
}
