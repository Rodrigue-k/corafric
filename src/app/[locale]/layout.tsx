import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/react";
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
  title: "Corafric — Collecte de données vocales en langues africaines",
  description: "Plateforme communautaire open source de collecte de données vocales pour le développement d'IA en langues africaines.",
  icons: {
    icon: "/images/logo.svg",
  },
  other: {
    "msedge-visual-search": "no",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate if locale is supported
  if (!routing.locales.includes(locale as any)) {
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
            {children}
          </NextIntlClientProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
