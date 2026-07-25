"use client";

import React, { useState } from "react";
import { Search, Play, Globe, ShieldCheck } from "lucide-react";

export const DictionarySearch = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Mock data for UI demonstration until API is ready
  const mockResults = query.toLowerCase() === "eau" || query.toLowerCase() === "water" || query.toLowerCase() === "tsi" ? [
    {
      id: "1",
      ewe: "tsi",
      fr: "eau",
      en: "water",
      definition: "Liquide transparent, incolore, inodore et insipide à l'état pur.",
      confidence: 3,
      hasAudio: true,
    }
  ] : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    // TODO: implement actual search API call
    setTimeout(() => setIsSearching(false), 500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un mot (Éwé, Français ou Anglais)..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg transition-all"
        />
        <button
          type="submit"
          className="absolute inset-y-2 right-2 px-6 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
        >
          {isSearching ? "..." : "Rechercher"}
        </button>
      </form>

      {/* Results Area */}
      <div className="space-y-4">
        {mockResults.map((result) => (
          <div key={result.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-display font-bold text-primary">{result.ewe}</h2>
                  {result.hasAudio && (
                    <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Écouter">
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vérifié par {result.confidence} sources</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5" />
                  Français
                </div>
                <p className="text-lg font-medium text-foreground">{result.fr}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5" />
                  English
                </div>
                <p className="text-lg font-medium text-foreground">{result.en}</p>
              </div>
            </div>
            
            {result.definition && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-text-muted">{result.definition}</p>
              </div>
            )}
          </div>
        ))}

        {query && mockResults.length === 0 && !isSearching && (
          <div className="text-center py-12 bg-white/50 border border-dashed border-border rounded-2xl">
            <p className="text-text-muted">Aucun résultat trouvé pour "{query}".</p>
            <p className="text-sm mt-2 text-primary cursor-pointer hover:underline">
              Proposer ce mot à la communauté ?
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
