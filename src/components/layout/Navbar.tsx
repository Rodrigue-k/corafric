"use client";

import React from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "../ui/Button";
import { Languages, Menu, X } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations("nav");
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Check if we are on the homepage (localized or root)
  const isHomePage = pathname === "/" || pathname === "" || pathname === "/fr" || pathname === "/en";

  React.useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

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
    <header
      className={
        isHomePage
          ? `fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 transform ${
              isScrolled
                ? "translate-y-0 opacity-100 border-b border-border bg-white/80 backdrop-blur-md shadow-sm"
                : "-translate-y-full opacity-0 pointer-events-none"
            }`
          : "sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md"
      }
    >
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
          <a
            href="mailto:hello@corafric.com?subject=Soutien%20au%20projet%20Corafric"
            className="text-sm font-semibold transition-colors text-primary hover:opacity-85"
          >
            {t("support")}
          </a>
        </nav>

        {/* Right action area: language switcher + auth */}
        <div className="flex items-center gap-2 md:gap-4">
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

          {/* Authentication buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile menu toggle & user button */}
          <div className="flex md:hidden items-center gap-2">
            {isSignedIn && (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 rounded-full border border-primary/20",
                  },
                }}
              />
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground hover:bg-black/5 rounded-md transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-border shadow-lg p-4 flex flex-col gap-4 z-40">
          <nav className="flex flex-col gap-4">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium px-2 py-1 rounded-md transition-colors ${
                    isActive ? "text-primary bg-primary/5" : "text-foreground hover:bg-black/5"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <a
              href="mailto:hello@corafric.com?subject=Soutien%20au%20projet%20Corafric"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold px-2 py-1 rounded-md transition-colors text-primary hover:bg-primary/5"
            >
              {t("support")}
            </a>
          </nav>
          
          {!isSignedIn && (
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-center">
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full justify-center">
                  {t("join")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
