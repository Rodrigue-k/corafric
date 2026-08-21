import React from "react";
import { getTranslations } from "next-intl/server";
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
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-140px)] flex flex-col justify-start">
      <ValidateClientPage />
    </div>
  );
}
