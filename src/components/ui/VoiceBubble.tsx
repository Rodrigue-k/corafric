import React from "react";
import { Mic } from "lucide-react";

interface VoiceBubbleProps {
  phrase: string;
  className?: string;
}

export const VoiceBubble: React.FC<VoiceBubbleProps> = ({ phrase, className = "" }) => {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/80 shadow-xs transition-transform duration-200 hover:scale-105 pointer-events-auto ${className}`}
    >
      <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Mic className="w-2.5 h-2.5 text-primary" />
      </div>
      <span className="text-xs font-semibold text-foreground whitespace-nowrap">
        « {phrase} »
      </span>
      <div className="flex items-center gap-0.5 ml-0.5 shrink-0" aria-hidden="true">
        <span className="w-0.5 h-2 bg-primary/50 rounded-full animate-pulse" />
        <span className="w-0.5 h-3.5 bg-primary rounded-full animate-pulse delay-75" />
        <span className="w-0.5 h-1.5 bg-primary/40 rounded-full animate-pulse delay-150" />
      </div>
    </div>
  );
};
