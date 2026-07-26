"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GlobalStats } from "@/types";

export function LiveStats() {
  const t = useTranslations("landing");
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<GlobalStats>({
    totalRecordings: 1248,
    approvedRecordings: 980,
    totalUsers: 84,
    totalHours: 3.4,
    totalSentences: 150,
  });

  useEffect(() => {
    let ignore = false;
    void (async () => {
      setMounted(true);
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (!ignore) setStats(data);
      } catch (err) {
        console.error("Error fetching live stats:", err);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="bg-primary-tint py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-display text-[#1A1A2E] font-bold mb-1">
              {mounted ? stats.totalRecordings.toLocaleString() : "0"}
            </p>
            <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
              {t("stats.recordings")}
            </p>
          </div>
          <div>
            <p className="text-display text-[#1A1A2E] font-bold mb-1">
              {mounted ? stats.totalUsers.toLocaleString() : "0"}
            </p>
            <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
              {t("stats.speakers")}
            </p>
          </div>
          <div>
            <p className="text-display text-[#1A1A2E] font-bold mb-1">
              {mounted ? (stats.totalHours || 0).toLocaleString() : "0"}h
            </p>
            <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">
              {t("stats.hours")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
