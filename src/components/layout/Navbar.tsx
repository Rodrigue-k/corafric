"use client";

import React from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "../ui/Button";
import { Languages } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations("nav");
  const { isSignedIn } = useAuth();

  const links = [
    { name: t("contribute"), href: "/contribute" as const },
    { name: t("validate"), href: "/validate" as const },
    { name: t("explore"), href: "/explore" as const },
  ];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as "en" | "fr";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Image
              src="/images/logo.svg"
              alt="Corafric Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-h3 font-semibold font-display tracking-tight text-foreground group-hover:text-primary transition-colors">
            Corafric
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-text-muted"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right action area: language switcher + auth */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-black/5 hover:bg-black/10 px-2 py-1.5 rounded-full transition-colors border border-border">
            <Languages className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={currentLocale}
              onChange={handleLanguageChange}
              className="bg-transparent text-xs font-semibold text-text-muted focus:outline-none cursor-pointer pr-1"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </div>

          {/* Authentication buttons */}
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 rounded-full border border-primary/20",
                },
              }}
            />
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="primary" size="sm">
                  {t("join")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
