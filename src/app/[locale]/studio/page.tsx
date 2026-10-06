import React from "react";
import { isCurrentUserAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { StudioClientPage } from "./StudioClientPage";

export const metadata = {
  title: "Studio Opérateur et Collecte Intensive — Corafric",
  description: "Interface interne haute cadence pour l'enregistrement et le contrôle qualité du dictionnaire audio.",
};

export default async function StudioPage() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-[calc(100vh-140px)] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 flex flex-col justify-start max-w-7xl mx-auto w-full">
      <StudioClientPage />
    </div>
  );
}
