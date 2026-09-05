import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://corafric.com"),
  title: "Corafric — Collecte de données vocales en langues africaines",
  description:
    "L'Infrastructure Vocale de l'Afrique. Corafric : plateforme technologique libre pour la numérisation, la préservation et l'intégration des langues africaines dans l'IA.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/images/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Corafric — Collecte de données vocales en langues africaines",
    description:
      "Plateforme communautaire open source de collecte de données vocales pour le développement d'IA en langues africaines.",
    url: "https://corafric.com",
    siteName: "Corafric",
    images: [
      {
        url: "/images/logo.svg",
        width: 800,
        height: 600,
        alt: "Corafric Logo",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  other: {
    "msedge-visual-search": "no",
  },
};

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate if locale is supported
  if (!routing.locales.includes(locale as unknown as typeof routing.locales[number])) {
    notFound();
  }

  // Load locale messages
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html
        lang={locale}
        className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <NextIntlClientProvider messages={messages}>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </NextIntlClientProvider>
          <Analytics />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
