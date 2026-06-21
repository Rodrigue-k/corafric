import React from "react";
import { Link } from "@/i18n/routing";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-caption text-text-muted">
          &copy; {new Date().getFullYear()} Corafric. Projet communautaire open-source.
        </p>
        <div className="flex gap-6">
          <Link href="/explore" className="text-caption text-text-muted hover:text-primary transition-colors">
            Dataset
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption text-text-muted hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};
