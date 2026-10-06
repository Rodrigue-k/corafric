"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "../ui/Button";
import { X, User, Mic, Shield } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const t = useTranslations("nav");
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isHomePage = pathname === "/" || pathname === "" || pathname === "/fr" || pathname === "/en";

  // Auto-close mobile drawer when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  // Check admin privileges when signed in
  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/admin/check")
        .then((res) => res.json())
        .then((data) => {
          if (data?.isAdmin) {
            setIsAdmin(true);
          }
        })
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [isSignedIn]);

  // Clean, focused showcase navigation links for the public
  const links = [
    { name: t("home"), href: "/" as const },
    { name: t("dictionary"), href: "/dictionary" as const },
    { name: t("explore"), href: "/explore" as const },
    { name: t("partnership"), href: "/contribuer" as const },
  ];

  const handleLanguageChange = (nextLocale: "en" | "fr") => {
    if (nextLocale === currentLocale) return;
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/(fr|en)(\/|$)/, `/${nextLocale}$2`);
    window.location.href = newPath + window.location.search;
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
              className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                currentLocale === "fr"
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              FR
            </button>
            <button
              onClick={() => handleLanguageChange("en")}
              className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                currentLocale === "en"
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              EN
            </button>
          </div>

          {/* Soundwave Menu Button */}
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
              {isMenuOpen ? t("close") : t("menu")}
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
                priority
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
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  currentLocale === "fr"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                FR
              </button>
              <button
                onClick={() => handleLanguageChange("en")}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
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
                      label={t("myProfile")}
                      href={`/${currentLocale}/profile`}
                      labelIcon={<User className="w-4 h-4" />}
                    />
                    {isAdmin && (
                      <UserButton.Link
                        label={t("admin")}
                        href={`/${currentLocale}/admin`}
                        labelIcon={<Shield className="w-4 h-4 text-purple-600" />}
                      />
                    )}
                    {isAdmin && (
                      <UserButton.Link
                        label={t("studio")}
                        href={`/${currentLocale}/studio`}
                        labelIcon={<Mic className="w-4 h-4 text-primary" />}
                      />
                    )}
                  </UserButton.MenuItems>
                </UserButton>
              ) : (
                <Link href="/sign-in">
                  <Button variant="outline" size="sm" className="rounded-full px-4 text-xs font-semibold">
                    {t("signIn")}
                  </Button>
                </Link>
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
                    <Image src="/images/logo.svg" alt="Logo" width={18} height={18} style={{ width: "18px", height: "18px" }} />
                  </div>
                  <span className="font-bold font-display text-lg text-foreground">Corafric</span>
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-md text-text-muted hover:text-foreground hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Public Navigation Links */}
              <nav className="flex flex-col space-y-1">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === "/profile"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-[#FAF8F5]"
                    }`}
                  >
                    {t("profile")}
                  </Link>
                )}
              </nav>

              {/* Internal Team / Admin Links for Authorized Users */}
              {isAdmin && (
                <div className="pt-4 border-t border-border space-y-1">
                  <span className="px-3 text-[10px] font-bold font-display uppercase tracking-wider text-primary">
                    Administration
                  </span>
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-purple-50 hover:text-purple-900 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    <span>Console Admin</span>
                  </Link>
                  <Link
                    href="/studio"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5 text-primary" />
                    <span>Studio</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{t("language")}</span>
                <div className="flex items-center bg-black/5 rounded-full p-0.5 border border-border">
                  <button
                    onClick={() => handleLanguageChange("fr")}
                    className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                      currentLocale === "fr" ? "bg-primary text-white font-semibold" : "text-text-muted"
                    }`}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                      currentLocale === "en" ? "bg-primary text-white font-semibold" : "text-text-muted"
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {!isSignedIn ? (
                <div>
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)} className="block w-full">
                    <Button variant="outline" size="sm" className="w-full justify-center rounded-full font-semibold">
                      {t("signIn")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-text-muted">{t("account")}</span>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8 rounded-full border border-primary/20",
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
