import React from "react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RecordingStudio } from "@/components/recording/RecordingStudio";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contribute" });
  return {
    title: `${t("title")} — Corafric`,
  };
}

export default async function ContributePage() {
  const t = await getTranslations("contribute");

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-h1 text-foreground font-display">{t("title")}</h1>
            <p className="text-body text-text-muted max-w-lg mx-auto">
              {t("phraseLabel")}
            </p>
          </div>

          <RecordingStudio />
        </div>
      </main>

      <Footer />
    </div>
  );
}
