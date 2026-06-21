import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Mail, Heart } from "lucide-react";

export const BrandShowcase: React.FC = () => {
  const t = useTranslations("brandShowcase");

  return (
    <section className="w-full bg-[#FAF8F5] border-t border-[#EADCC9]/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Logo Column (order-2 on mobile, order-1 on desktop) */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
            <div className="relative group">
              <Image
                src="/images/logo.svg"
                alt="Corafric Logo"
                width={200}
                height={200}
                className="w-36 h-auto md:w-44 object-contain transition-transform duration-500 group-hover:scale-105"
                style={{ height: "auto" }}
                priority
              />
            </div>
          </div>

          {/* Slogan & Info Column (order-1 on mobile, order-2 on desktop) */}
          <div className="md:col-span-8 flex flex-col space-y-4 text-center md:text-left order-1 md:order-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground leading-tight tracking-tight">
              {t("tagline")}
            </h2>
            <p className="text-body text-text-muted max-w-xl mx-auto md:mx-0 text-sm">
              {t("description")}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-5 pt-1 text-sm text-foreground/80 font-medium">
              <a
                href="mailto:hello@corafric.com"
                className="flex items-center gap-2 hover:text-primary transition-colors duration-200"
              >
                <Mail className="w-4 h-4 text-primary" />
                <span>{t("email")}</span>
              </a>
              <span className="hidden sm:inline text-text-muted/40">|</span>
              <a
                href="https://github.com/Rodrigue-k/corafric"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors duration-200"
              >
                <svg className="w-4 h-4 text-primary fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                <span>{t("github")}</span>
              </a>
              <span className="hidden sm:inline text-text-muted/40">|</span>
              <Link
                href="/contribuer"
                className="flex items-center gap-2 text-primary font-semibold hover:opacity-85 transition-opacity duration-200"
              >
                <Heart className="w-4 h-4 text-primary fill-primary/10" />
                <span>{t("support")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
