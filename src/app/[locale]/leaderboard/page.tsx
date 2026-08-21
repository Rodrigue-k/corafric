import React from "react";
import { getTranslations } from "next-intl/server";
import { LeaderboardClientPage } from "./LeaderboardClientPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: `Classement des Contributeurs — Corafric`,
    description: "Classement des contributeurs les plus actifs au corpus vocal en langues africaines.",
  };
}

export default async function LeaderboardPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <LeaderboardClientPage />
    </div>
  );
}
