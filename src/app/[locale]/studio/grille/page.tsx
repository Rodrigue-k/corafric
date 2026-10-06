import React from "react";
import { isCurrentUserAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { StudioGrilleClient } from "./StudioGrilleClient";

export const metadata = {
  title: "Feuille de Pistes Studio — Dictionnaire Vocabulaire Éwé",
  description: "Grille d'enregistrement séquentielle pour le studio d'enregistrement et la numérotation des pistes audio.",
};

export default async function StudioGrillePage() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-[calc(100vh-140px)] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <StudioGrilleClient />
    </div>
  );
}
