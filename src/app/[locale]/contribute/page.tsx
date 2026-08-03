import React from "react";
import { getTranslations } from "next-intl/server";
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
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl w-full space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display">
            {t("title")}
          </h1>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            {t("phraseLabel")}
          </p>
        </div>

        <RecordingStudio />
      </div>
    </div>
  );
}
