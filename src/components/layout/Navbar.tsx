"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "../ui/Button";
import { Languages, X, User } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations("nav");
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isHomePage = pathname === "/" || pathname === "" || pathname === "/fr" || pathname === "/en";

  useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  const links = [
    { name: t("home"), href: "/" as const },
    { name: t("contribute"), href: "/contribute" as const },
    { name: t("validate"), href: "/validate" as const },
    { name: t("dictionary"), href: "/dictionary" as const },
    { name: t("leaderboard"), href: "/leaderboard" as const },
  ];

  const handleLanguageChange = (nextLocale: "en" | "fr") => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <>
      {/* 1. FLOATING BRAND TRIGGER IN TOP-RIGHT CORNER (When header is not yet scrolled on homepage) */}
      {isHomePage && !isScrolled && (
        <div className="fixed top-5 right-4 sm:right-8 z-50 flex items-center gap-2 animate-in fade-in duration-300">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-white/90 backdrop-blur-md border border-border rounded-full p-1 shadow-xs text-xs font-semibold">
            <button
              onClick={() => handleLanguageChange("fr")}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                currentLocale === "fr"
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              FR
            </button>
            <button
              onClick={() => handleLanguageChange("en")}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                currentLocale === "en"
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              EN
            </button>
          </div>

          {/* Unique Acoustic Soundwave Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/90 backdrop-blur-md border border-border rounded-full shadow-xs hover:border-primary/40 text-foreground transition-all group cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {isMenuOpen ? (
              <X className="w-4 h-4 text-primary" />
            ) : (
              <div className="flex items-center gap-0.5 h-4">
                <span className="w-0.5 h-2.5 bg-foreground group-hover:bg-primary transition-colors rounded-full" />
                <span className="w-0.5 h-4 bg-primary rounded-full" />
                <span className="w-0.5 h-2 bg-foreground group-hover:bg-primary transition-colors rounded-full" />
                <span className="w-0.5 h-3.5 bg-primary rounded-full" />
              </div>
            )}
            <span className="text-xs font-semibold hidden sm:inline text-foreground">
              {isMenuOpen ? "Fermer" : "Menu"}
            </span>
          </button>
        </div>
      )}

      {/* 2. MAIN NAVBAR (Visible on non-homepage routes or when scrolled) */}
      <header
        className={
          isHomePage
            ? `fixed top-0 left-0 right-0 z-40 w-full transition-all duration-300 transform ${
                isScrolled
                  ? "translate-y-0 opacity-100 border-b border-border bg-white/90 backdrop-blur-md shadow-xs"
                  : "-translate-y-full opacity-0 pointer-events-none"
              }`
            : "sticky top-0 z-40 w-full border-b border-border bg-white/90 backdrop-blur-md shadow-xs"
        }
      >
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Image
                src="/images/logo.svg"
                alt="Corafric Logo"
                width={22}
                height={22}
                className="object-contain"
                style={{ width: "22px", height: "22px" }}
              />
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-foreground group-hover:text-primary transition-colors">
              Corafric
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary font-semibold" : "text-text-muted"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-black/5 rounded-full p-0.5 border border-border text-xs font-semibold">
              <button
                onClick={() => handleLanguageChange("fr")}
                className={`px-2 py-0.5 rounded-full transition-colors ${
                  currentLocale === "fr"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                FR
              </button>
              <button
                onClick={() => handleLanguageChange("en")}
                className={`px-2 py-0.5 rounded-full transition-colors ${
                  currentLocale === "en"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                EN
              </button>
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 rounded-full border border-primary/20",
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="Mon profil et statistiques"
                      href={`/${currentLocale}/profile`}
                      labelIcon={<User className="w-4 h-4" />}
                    />
                  </UserButton.MenuItems>
                </UserButton>
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


            {/* Mobile Soundwave Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center p-2 rounded-lg border border-border text-foreground hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-primary" />
              ) : (
                <div className="flex items-center gap-0.5 h-4">
                  <span className="w-0.5 h-2.5 bg-foreground rounded-full" />
                  <span className="w-0.5 h-4 bg-primary rounded-full" />
                  <span className="w-0.5 h-2 bg-foreground rounded-full" />
                  <span className="w-0.5 h-3 bg-primary rounded-full" />
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 3. REFINED NAVIGATION DRAWER / MODAL */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between border-l border-border animate-in slide-in-from-right duration-250">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                  <div className="w-7 h-7 flex items-center justify-center bg-primary/10 rounded-md">
                    <Image src="/images/logo.svg" alt="Logo" width={18} height={18} />
                  </div>
                  <span className="font-bold font-display text-lg text-foreground">Corafric</span>
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-md text-text-muted hover:text-foreground hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-1">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-[#FAF8F5]"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
                {isSignedIn && (
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === "/profile"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-[#FAF8F5]"
                    }`}
                  >
                    {t("profile")}
                  </Link>
                )}
              </nav>

            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Langue</span>
                <div className="flex items-center bg-black/5 rounded-full p-0.5 border border-border">
                  <button
                    onClick={() => handleLanguageChange("fr")}
                    className={`px-2 py-0.5 rounded-full transition-colors ${
                      currentLocale === "fr" ? "bg-primary text-white font-semibold" : "text-text-muted"
                    }`}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`px-2 py-0.5 rounded-full transition-colors ${
                      currentLocale === "en" ? "bg-primary text-white font-semibold" : "text-text-muted"
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {!isSignedIn ? (
                <div className="space-y-2">
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)} className="block w-full">
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      {t("signIn")}
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)} className="block w-full">
                    <Button variant="primary" size="sm" className="w-full justify-center">
                      {t("join")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-text-muted">Compte</span>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8 rounded-full border border-primary/20",
                      },
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Mon profil et statistiques"
                        href={`/${currentLocale}/profile`}
                        labelIcon={<User className="w-4 h-4" />}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
