"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { 
  Play, Pause, ArrowRight, ArrowLeft, Check, 
  Trash2, SkipForward, Search, Loader2, Music, CheckCircle2, AlertCircle
} from "lucide-react";

interface UnassignedAudio {
  filename: string;
  url: string;
}

interface PendingWord {
  id: string;
  wordEwe: string;
  wordFr: string;
  definition: string;
}

export function StudioMatcherClient() {
  const [audios, setAudios] = useState<UnassignedAudio[]>([]);
  const [words, setWords] = useState<PendingWord[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudios, setIsLoadingAudios] = useState(true);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionStatus, setActionStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchAudios();
    fetchWords("");
  }, []);

  const fetchAudios = async () => {
    setIsLoadingAudios(true);
    try {
      const res = await fetch("/api/studio/unassigned-audios");
      const data = await res.json();
      setAudios(data.audios || []);
    } catch (err) {
      console.error("Error fetching audios", err);
    } finally {
      setIsLoadingAudios(false);
    }
  };

  const fetchWords = async (q: string) => {
    setIsLoadingWords(true);
    try {
      const res = await fetch(`/api/studio/pending-words?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setWords(data.words || []);
    } catch (err) {
      console.error("Error fetching words", err);
    } finally {
      setIsLoadingWords(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchWords(searchQuery);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const currentAudio = audios[currentAudioIndex] || null;

  useEffect(() => {
    if (audioRef.current && currentAudio) {
      audioRef.current.src = currentAudio.url;
      setIsPlaying(false);
    }
  }, [currentAudioIndex, currentAudio]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextAudio = () => {
    if (currentAudioIndex < audios.length - 1) {
      setCurrentAudioIndex(prev => prev + 1);
    }
  };

  const prevAudio = () => {
    if (currentAudioIndex > 0) {
      setCurrentAudioIndex(prev => prev - 1);
    }
  };

  const showStatus = (message: string, type: 'success' | 'error') => {
    setActionStatus({ message, type });
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleLinkAudio = async (word: PendingWord) => {
    if (!currentAudio) return;
    
    try {
      const res = await fetch("/api/studio/map-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.id, audioUrl: currentAudio.url }),
      });
      
      if (res.ok) {
        showStatus(`Lié: ${word.wordEwe} → ${currentAudio.filename}`, 'success');
        // Remove audio from list
        const newAudios = [...audios];
        newAudios.splice(currentAudioIndex, 1);
        setAudios(newAudios);
        // Remove word from list
        setWords(words.filter(w => w.id !== word.id));
        // Note: Audio index stays same (which points to next track now)
        if (currentAudioIndex >= newAudios.length) {
          setCurrentAudioIndex(Math.max(0, newAudios.length - 1));
        }
      } else {
        showStatus("Erreur lors de la liaison", 'error');
      }
    } catch (err) {
      showStatus("Erreur réseau", 'error');
    }
  };

  const handleRejectWord = async (word: PendingWord) => {
    try {
      const res = await fetch("/api/studio/reject-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.id }),
      });
      
      if (res.ok) {
        showStatus(`Rejeté: ${word.wordEwe}`, 'success');
        setWords(words.filter(w => w.id !== word.id));
      } else {
        showStatus("Erreur lors du rejet", 'error');
      }
    } catch (err) {
      showStatus("Erreur réseau", 'error');
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Audio Matcher
          </h1>
          <p className="text-sm text-text-muted">
            Associez chaque piste audio non assignée au bon mot du dictionnaire.
          </p>
        </div>
        <Link 
          href="/studio/grille" 
          className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-black/5 transition"
        >
          Retour à la Grille
        </Link>
      </div>

      {/* Status Toast */}
      {actionStatus && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          actionStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {actionStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionStatus.message}
        </div>
      )}

      {/* Main Container - Split View on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Top: Audio Player Sticky */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
              Piste à lier ({audios.length} restantes)
            </h2>
          </div>

          {isLoadingAudios ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-xs">Chargement des audios...</span>
            </div>
          ) : audios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
              <p className="font-bold text-foreground">Terminé !</p>
              <p className="text-sm text-text-muted">Toutes les pistes ont été assignées.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-border flex items-center justify-center text-primary shadow-inner">
                <Music className="w-7 h-7" />
              </div>
              
              <div>
                <p className="font-mono font-bold text-lg text-foreground">
                  {currentAudio?.filename}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Piste {currentAudioIndex + 1} sur {audios.length}
                </p>
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-center gap-4 w-full pt-4">
                <button 
                  onClick={prevAudio}
                  disabled={currentAudioIndex === 0}
                  className="p-3 rounded-full hover:bg-[#FAF9F6] text-text-muted disabled:opacity-30 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow-md transition"
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </button>

                <button 
                  onClick={nextAudio}
                  disabled={currentAudioIndex === audios.length - 1}
                  className="p-3 rounded-full hover:bg-[#FAF9F6] text-text-muted disabled:opacity-30 transition"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              
              <button 
                onClick={nextAudio}
                className="text-xs font-semibold text-text-muted hover:text-foreground mt-2 flex items-center gap-1"
              >
                Ignorer cette piste <SkipForward className="w-3.5 h-3.5" />
              </button>

              <audio 
                ref={audioRef} 
                onEnded={() => setIsPlaying(false)}
                className="hidden" 
              />
            </div>
          )}
        </div>

        {/* Right/Bottom: Words List */}
        <div className="lg:col-span-7 bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
              Sélectionner le mot correspondant
            </h2>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par mot éwé ou français..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Words List */}
          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingWords ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              </div>
            ) : words.length === 0 ? (
              <div className="py-10 text-center text-sm text-text-muted">
                Aucun mot en attente ne correspond à la recherche.
              </div>
            ) : (
              words.map((word) => (
                <div 
                  key={word.id} 
                  className="p-4 rounded-xl border border-border hover:border-primary/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div>
                    <h3 className="font-display font-bold text-lg text-foreground">
                      « {word.wordEwe} »
                    </h3>
                    {word.wordFr && (
                      <p className="text-sm font-medium text-text-muted">
                        {word.wordFr}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRejectWord(word)}
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs transition flex items-center gap-1.5 border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rejeter le mot</span>
                    </button>
                    
                    <button
                      onClick={() => handleLinkAudio(word)}
                      disabled={!currentAudio}
                      className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Lier
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
