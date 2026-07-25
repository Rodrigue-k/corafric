"use client";

import React, { useState } from "react";
import { Search, Volume2 } from "lucide-react";

export const DictionarySearch = () => {
  const [query, setQuery] = useState("");
  
  const mockResults = query.toLowerCase() === "eau" || query.toLowerCase() === "water" || query.toLowerCase() === "tsi" ? [
    { id: "1", ewe: "tsi", fr: "eau", en: "water", definition: "", hasAudio: true }
  ] : [];

  return (
    <div className="w-full space-y-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un mot (Éwé, Français ou Anglais)"
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 text-lg shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {mockResults.map((result) => (
          <div key={result.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-4xl font-semibold text-gray-900">{result.ewe}</h2>
              {result.hasAudio && (
                <button className="p-3 rounded-full hover:bg-gray-100 text-gray-700 transition-colors" title="Écouter la prononciation">
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex gap-8 text-lg text-gray-600">
              <div><span className="text-sm text-gray-400 uppercase tracking-widest block mb-1">Français</span>{result.fr}</div>
              <div><span className="text-sm text-gray-400 uppercase tracking-widest block mb-1">English</span>{result.en}</div>
            </div>
          </div>
        ))}
        
        {query && mockResults.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun résultat trouvé pour "{query}".
          </div>
        )}
      </div>
    </div>
  );
};
