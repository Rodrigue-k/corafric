import React from "react";
import { getTranslations } from "next-intl/server";
import ExploreClientPage from "./ExploreClientPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "explore" });
  return {
    title: `${t("title")} — Corafric`,
  };
}

export default async function ExplorePage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <ExploreClientPage />
    </div>
  );
}
