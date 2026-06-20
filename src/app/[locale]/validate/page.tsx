import React from "react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import ValidateClientPage from "./ValidateClientPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "validate" });
  return {
    title: `${t("title")} — Corafric`,
  };
}

export default async function ValidatePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <ValidateClientPage />
      </main>

      <Footer />
    </div>
  );
}
