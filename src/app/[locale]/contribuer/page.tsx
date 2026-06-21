import React from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contribuer" });
  return {
    title: `${t("hero.tag")} — Corafric`,
  };
}

export default async function ContribuerPage() {
  const t = await getTranslations("contribuer");

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans overflow-hidden">
      <Navbar />

      <main className="flex-grow">
        {/* SECTION 1 - HERO SPLIT */}
        <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center bg-[#F7F3EE]">
          {/* Background decorative shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Left terracotta light shape */}
            <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[70vh] bg-[#B84A2A] opacity-[0.04] rotate-[-12deg] rounded-[60px]" />
            {/* Right gold light shape behind the image */}
            <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[80vh] bg-[#D4A017] opacity-[0.06] rotate-[8deg] rounded-[80px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[calc(100vh-160px)]">
              {/* Left Column (55%) */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-center lg:text-left py-12 lg:py-0">
                <span className="text-caption text-primary uppercase tracking-widest font-semibold block">
                  {t("hero.tag")}
                </span>
                <h1 className="text-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight whitespace-pre-line">
                  {t("hero.title")}
                </h1>
                <p className="text-body text-text-muted max-w-xl mx-auto lg:mx-0 text-base sm:text-lg">
                  {t("hero.subtitle")}
                </p>
              </div>

              {/* Right Column (45%) */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end items-end h-full relative self-end w-full max-w-[450px] lg:max-w-none mx-auto lg:mx-0">
                <div className="relative w-full aspect-[2/3] lg:h-[75vh] lg:w-auto max-h-[600px] flex items-end">
                  <Image
                    src="/images/contribute-person.webp"
                    alt="Corafric Contributor"
                    width={450}
                    height={675}
                    className="object-contain w-full h-full max-h-[600px] select-none pointer-events-none drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 - 3 WAYS TO CONTRIBUTE */}
        <section className="relative py-24 bg-white border-t border-[#EADCC9]/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="relative bg-[#F7F3EE]/40 border border-[#EADCC9]/50 rounded-3xl p-8 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all duration-300">
                {/* Number Background */}
                <span className="absolute right-4 top-2 text-7xl font-display font-bold text-[#B84A2A] opacity-[0.07] select-none group-hover:scale-110 transition-transform duration-300">
                  {t("cards.card1.num")}
                </span>
                <div className="space-y-4 relative z-10">
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground pr-8">
                    {t("cards.card1.title")}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {t("cards.card1.desc")}
                  </p>
                </div>
                <div className="pt-8">
                  <Link
                    href="/contribute"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:underline"
                  >
                    <span>{t("cards.card1.cta")}</span>
                  </Link>
                </div>
              </div>

              {/* Card 2 */}
              <div className="relative bg-[#F7F3EE]/40 border border-[#EADCC9]/50 rounded-3xl p-8 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all duration-300">
                {/* Number Background */}
                <span className="absolute right-4 top-2 text-7xl font-display font-bold text-[#B84A2A] opacity-[0.07] select-none group-hover:scale-110 transition-transform duration-300">
                  {t("cards.card2.num")}
                </span>
                <div className="space-y-4 relative z-10">
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground pr-8">
                    {t("cards.card2.title")}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {t("cards.card2.desc")}
                  </p>
                </div>
                <div className="pt-8">
                  <a
                    href="https://github.com/Rodrigue-k/corafric"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:underline"
                  >
                    <span>{t("cards.card2.cta")}</span>
                  </a>
                </div>
              </div>

              {/* Card 3 */}
              <div className="relative bg-[#F7F3EE]/40 border border-[#EADCC9]/50 rounded-3xl p-8 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all duration-300">
                {/* Number Background */}
                <span className="absolute right-4 top-2 text-7xl font-display font-bold text-[#B84A2A] opacity-[0.07] select-none group-hover:scale-110 transition-transform duration-300">
                  {t("cards.card3.num")}
                </span>
                <div className="space-y-4 relative z-10">
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground pr-8">
                    {t("cards.card3.title")}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {t("cards.card3.desc")}
                  </p>
                </div>
                <div className="pt-8">
                  <a
                    href="mailto:hello@corafric.com?subject=Partage%20et%20promotion%20du%20projet%20Corafric"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:underline"
                  >
                    <span>{t("cards.card3.cta")}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 - WHY THIS PROJECT EXISTS (MANIFESTO) */}
        <section className="relative py-24 bg-[#F2ECE4] border-t border-[#EADCC9]/40 overflow-hidden">
          {/* Decorative subtle background shape */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-[#B84A2A] opacity-[0.02] rotate-45 rounded-[120px]" />
          </div>

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground leading-snug max-w-3xl mx-auto whitespace-pre-line">
              {t("manifesto.title")}
            </h2>
            
            {/* Custom terracotta -> gold gradient separator */}
            <div className="w-48 h-[3px] bg-gradient-to-r from-[#B84A2A] to-[#D4A017] mx-auto rounded-full" />
            
            <p className="text-body text-text-muted max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              {t("manifesto.body")}
            </p>
          </div>
        </section>

        {/* SECTION 4 - PARTNERSHIPS */}
        <section className="relative py-20 bg-white border-t border-[#EADCC9]/30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {t("partnership.title")}
            </h2>
            <p className="text-body text-text-muted max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              {t("partnership.body")}
            </p>
            <div className="pt-4">
              <a
                href="mailto:contact@corafric.com?subject=Partenariat%20Corafric"
                className="inline-flex items-center gap-2 bg-[#B84A2A] hover:bg-[#A33D20] text-white font-semibold px-6 py-3 rounded-full text-sm shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span>{t("partnership.cta")}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
