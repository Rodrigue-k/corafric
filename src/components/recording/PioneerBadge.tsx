"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface PioneerData {
  isAuthenticated: boolean;
  rank: number | null;
  totalUsers: number;
  username?: string;
  totalContributions?: number;
}

export const PioneerBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { isSignedIn } = useAuth();
  const [data, setData] = useState<PioneerData | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!isSignedIn) return;

    async function fetchRank() {
      try {
        const res = await fetch("/api/me/rank");
        const json = await res.json();
        if (!ignore && json) {
          setData(json);
        }
      } catch (err) {
        console.error("Error fetching pioneer rank:", err);
      }
    }

    void fetchRank();
    return () => {
      ignore = true;
    };
  }, [isSignedIn]);

  if (!isSignedIn || !data?.rank) {
    return null;
  }

  const ordinalSuffix = (num: number) => {
    if (num === 1) return "er";
    return "e";
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border text-xs text-text-muted ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      <span>
        Pionnier <strong className="font-semibold text-foreground">n°{data.rank}{ordinalSuffix(data.rank)}</strong>
      </span>
      {data.totalContributions !== undefined && data.totalContributions > 0 && (
        <>
          <span className="text-border">·</span>
          <span>{data.totalContributions} contribution{data.totalContributions > 1 ? "s" : ""}</span>
        </>
      )}
    </div>
  );
};
