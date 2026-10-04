import React from "react";
import { StudioClientPage } from "./StudioClientPage";

export const metadata = {
  title: "Studio Opérateur et Collecte Intensive — Corafric",
  description: "Interface haute cadence pour l'enregistrement et le contrôle qualité des corpus vocaux en langues africaines.",
};

export default function StudioPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 flex flex-col justify-start max-w-7xl mx-auto w-full">
      <StudioClientPage />
    </div>
  );
}
