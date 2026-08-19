import React from "react";
import { getTranslations } from "next-intl/server";
import { ContributeClientPage } from "./ContributeClientPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contribute" });
  return {
    title: `${t("title")} — Corafric`,
  };
}

export default async function ContributePage() {
  return (
    <div className="min-h-[calc(100vh-130px)] flex flex-col justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <ContributeClientPage />
    </div>
  );
}


