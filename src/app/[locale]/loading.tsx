import React from "react";

export default function Loading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Top subtle indeterminate progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-primary/20 z-50 overflow-hidden">
        <div className="h-full bg-primary w-1/3 animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* Header skeleton */}
      <div className="space-y-3 text-center max-w-xl mx-auto">
        <div className="h-3 w-28 bg-[#FAF9F6] border border-[#E8E5DF] rounded mx-auto" />
        <div className="h-8 w-64 bg-[#FAF9F6] border border-[#E8E5DF] rounded-lg mx-auto" />
        <div className="h-4 w-80 bg-[#FAF9F6] rounded mx-auto" />
      </div>

      {/* Content area placeholder */}
      <div className="bg-white border border-[#E8E5DF] rounded-xl p-6 sm:p-8 space-y-4 shadow-2xs">
        <div className="h-5 w-40 bg-[#FAF9F6] border border-[#E8E5DF] rounded" />
        <div className="space-y-3 pt-2">
          <div className="h-10 bg-[#FAF9F6] rounded-lg" />
          <div className="h-10 bg-[#FAF9F6] rounded-lg" />
          <div className="h-10 bg-[#FAF9F6] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
