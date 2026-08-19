import React from "react";
import { getTranslations } from "next-intl/server";
import DictionaryClient from "./DictionaryClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dictionary" });
  return {
    title: `${t("title")} — Corafric`,
    description: t("subtitle"),
  };
}

export default async function DictionaryPage() {
  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
      <DictionaryClient />
    </div>
  );
}
