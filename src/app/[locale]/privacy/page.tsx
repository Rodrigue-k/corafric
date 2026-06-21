import React from "react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: `${t("title")} — Corafric`,
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <main className="flex-grow py-24 px-4 sm:px-6 lg:px-8 bg-[#F7F3EE]">
        <div className="mx-auto max-w-3xl bg-white rounded-3xl p-8 sm:p-12 border border-[#EADCC9]/50 shadow-sm space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Link>
          
          <div className="space-y-4">
            <h1 className="text-display text-3xl sm:text-4xl font-bold font-display text-foreground leading-tight">
              {t("title")}
            </h1>
            <div className="w-20 h-1 bg-primary rounded-full" />
          </div>

          <div className="text-body text-text-muted leading-relaxed space-y-6">
            <p>{t("content")}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
