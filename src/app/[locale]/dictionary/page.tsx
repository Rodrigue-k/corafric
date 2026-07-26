import React from "react";
import { getTranslations } from "next-intl/server";
import { BookOpen, Search, Volume2, ShieldCheck, Database } from "lucide-react";
import DictionaryClient from "./DictionaryClient";

export default async function DictionaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dictionary" });

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold tracking-wide uppercase mb-4">
            <Database className="w-4 h-4" />
            <span>Dataset</span>
          </div>
          <h1 className="text-h1 font-display text-foreground mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-text-muted">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Search and Results Client */}
      <DictionaryClient />
    </div>
  );
}
