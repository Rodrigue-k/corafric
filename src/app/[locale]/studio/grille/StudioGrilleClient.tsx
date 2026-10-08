"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { 
  Printer, 
  Search, 
  CheckCircle2, 
  RotateCcw, 
  UploadCloud, 
  Tv, 
  Volume2, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Check, 
  AlertTriangle, 
  Filter,
  X,
  Play,
  Layers,
  Sparkles,
  Mic,
  Music
} from "lucide-react";

interface WordTrack {
  trackNumber: number;
  trackLabel: string;
  id: string;
  wordEwe: string;
  wordFr: string;
  definition: string;
  partOfSpeech: string;
  hasAudio: boolean;
  audioUrl: string | null;
  status?: "pending" | "recorded" | "redo";
  operatorName?: string | null;
}

type TrackStatus = "pending" | "recorded" | "redo";

export function StudioGrilleClient() {
  const [words, setWords] = useState<WordTrack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "without_audio" | "with_audio">("all");

  // Track progress status per trackNumber stored in DB and cached in state
  const [trackStatuses, setTrackStatuses] = useState<Record<number, TrackStatus>>({});

  // View modes: 'table' | 'prompter' | 'upload'
  const [activeTab, setActiveTab] = useState<"table" | "prompter" | "upload">("table");

  // Prompter state (active track index)
  const [prompterIndex, setPrompterIndex] = useState<number>(0);

  // Audio Dropzone state
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; trackNum: number | null; matchedWord: WordTrack | null; status: "ready" | "uploading" | "done" | "error" }[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState<boolean>(false);

  // Fetch words with database statuses
  const fetchWords = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      else setIsSyncing(true);

      const res = await fetch("/api/studio/words?limit=1500");
      if (!res.ok) throw new Error("Erreur de chargement de la liste des mots");
      const data = await res.json();
      const fetchedWords = (data.words || []) as WordTrack[];
      setWords(fetchedWords);

      // Populate statuses directly from the shared PostgreSQL database
      setTrackStatuses((prev) => {
        const next = { ...prev };
        fetchedWords.forEach((w) => {
          next[w.trackNumber] = w.status || (w.hasAudio ? "recorded" : "pending");
        });
        return next;
      });
    } catch (err: unknown) {
      if (showLoading) {
        setErrorMsg(err instanceof Error ? err.message : "Erreur réseau");
      }
    } finally {
      if (showLoading) setIsLoading(false);
      else setIsSyncing(false);
    }
  }, []);

  // Initial load and periodic 8-second background synchronization for multiple studio devices
  useEffect(() => {
    fetchWords(true);
    const interval = setInterval(() => {
      fetchWords(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchWords]);

  // Save track status in PostgreSQL DB so all team devices stay in sync
  const setStatus = async (trackNum: number, status: TrackStatus) => {
    // 1. Optimistic UI update
    setTrackStatuses((prev) => ({ ...prev, [trackNum]: status }));

    const word = words.find((w) => w.trackNumber === trackNum);
    if (!word) return;

    // 2. Persist in database
    try {
      const operatorName = typeof window !== "undefined" ? localStorage.getItem("corafric_studio_operator") || "Studio" : "Studio";
      await fetch("/api/studio/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: word.id,
          trackNumber: trackNum,
          status,
          operatorName,
        }),
      });
    } catch (err) {
      console.error("DB Sync error for track:", trackNum, err);
    }
  };

  // Filtered words
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      if (filterMode === "without_audio" && w.hasAudio) return false;
      if (filterMode === "with_audio" && !w.hasAudio) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          w.wordEwe.toLowerCase().includes(q) ||
          w.wordFr.toLowerCase().includes(q) ||
          w.trackLabel.toLowerCase().includes(q) ||
          w.trackNumber.toString() === q
        );
      }
      return true;
    });
  }, [words, filterMode, searchQuery]);

  // Keyboard navigation for prompter mode
  useEffect(() => {
    if (activeTab !== "prompter") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.code === "Space") {
        e.preventDefault();
        setPrompterIndex((prev) => Math.min(filteredWords.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPrompterIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const current = filteredWords[prompterIndex];
        if (current) {
          setStatus(current.trackNumber, "recorded");
          setPrompterIndex((prev) => Math.min(filteredWords.length - 1, prev + 1));
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setActiveTab("table");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, prompterIndex, filteredWords]);

  // Parse track number from file name (e.g. "piste 01.wav", "002.mp3", "track_42.wav", "piste_105.webm")
  const parseTrackNumberFromFilename = (filename: string): number | null => {
    // Remove extension
    const base = filename.replace(/\.[^/.]+$/, "");
    // Look for numbers preceded by piste, track, or standalone
    const match = base.match(/(?:piste|track|audio|take)?[\s_-]*(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      return !isNaN(num) && num > 0 ? num : null;
    }
    return null;
  };

  // Handle files dropped in batch uploader
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newEntries = Array.from(files).map((file) => {
      const trackNum = parseTrackNumberFromFilename(file.name);
      const matchedWord = trackNum ? words.find((w) => w.trackNumber === trackNum) || null : null;
      return {
        file,
        trackNum,
        matchedWord,
        status: "ready" as const,
      };
    });

    setUploadedFiles((prev) => [...prev, ...newEntries]);
  };

  // Upload all matched tracks
  const handleBatchUpload = async () => {
    if (uploadedFiles.length === 0 || isBatchUploading) return;
    setIsBatchUploading(true);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const item = uploadedFiles[i];
      if (!item.matchedWord || item.status === "done") continue;

      setUploadedFiles((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "uploading" } : it))
      );

      try {
        const formData = new FormData();
        formData.append("audio", item.file);
        formData.append("wordId", item.matchedWord.id);
        formData.append("trackNumber", item.matchedWord.trackNumber.toString());

        const res = await fetch("/api/studio/upload-track", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          // Update local word audioUrl
          setWords((prev) =>
            prev.map((w) =>
              w.id === item.matchedWord?.id ? { ...w, hasAudio: true, audioUrl: data.audioUrl } : w
            )
          );
          setStatus(item.matchedWord.trackNumber, "recorded");
          setUploadedFiles((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, status: "done" } : it))
          );
        } else {
          setUploadedFiles((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, status: "error" } : it))
          );
        }
      } catch (err) {
        console.error("Upload error for file:", item.file.name, err);
        setUploadedFiles((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: "error" } : it))
        );
      }
    }

    setIsBatchUploading(false);
  };

  // Stats calculation
  const totalRecordedInSession = Object.values(trackStatuses).filter((s) => s === "recorded").length;
  const totalRedoInSession = Object.values(trackStatuses).filter((s) => s === "redo").length;

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto px-2 sm:px-4 pb-12">
      {/* ─── Top Studio Bar ─── */}
      <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#F9EBE6] text-[#B84A2A] flex items-center justify-center font-bold shadow-xs shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-base sm:text-lg text-[#141416] tracking-tight font-display">
                Feuille de Pistes Studio — Vocabulaire Éwé
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#F9EBE6] text-[#B84A2A] border border-[#F2D7CE]">
                {words.length} Mots Numérotés
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? "bg-[#B84A2A] animate-ping" : "bg-emerald-600"}`} />
                <span>{isSyncing ? "Synchro..." : "En direct (Synchronisé multi-postes)"}</span>
              </div>
            </div>
            <p className="text-xs text-[#68645E] mt-0.5">
              Chaque mot possède un numéro de piste séquentiel fixe (Piste 01, Piste 02, etc.).
            </p>
          </div>
        </div>

        {/* Action Tabs and Navigation */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {/* Segmented Tab Controls */}
          <div className="flex bg-[#FAF9F6] p-1 rounded-xl border border-[#E8E5DF] w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("table")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition text-center ${
                activeTab === "table"
                  ? "bg-white text-[#B84A2A] shadow-xs font-bold"
                  : "text-[#68645E] hover:text-[#141416]"
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => {
                setActiveTab("prompter");
                setPrompterIndex(0);
              }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === "prompter"
                  ? "bg-white text-[#B84A2A] shadow-xs font-bold"
                  : "text-[#68645E] hover:text-[#141416]"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Prompteur</span>
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === "upload"
                  ? "bg-white text-[#B84A2A] shadow-xs font-bold"
                  : "text-[#68645E] hover:text-[#141416]"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/studio/matcher"
              className="px-3 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F0EEEA] border border-[#E8E5DF] text-[#141416] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
              title="Associer manuellement les fichiers audios aux mots"
            >
              <Music className="w-3.5 h-3.5 text-[#B84A2A]" />
              <span className="hidden sm:inline">Lier Audios</span>
            </Link>

            <Link
              href="/studio"
              className="px-3 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F0EEEA] border border-[#E8E5DF] text-[#141416] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
              title="Revenir à l'enregistrement des phrases directes"
            >
              <Mic className="w-3.5 h-3.5 text-[#B84A2A]" />
              <span className="hidden sm:inline">Phrases</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F0EEEA] border border-[#E8E5DF] text-[#141416] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
              title="Imprimer la feuille de pistes pour le studio"
            >
              <Printer className="w-3.5 h-3.5 text-[#B84A2A]" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: Prompter Mode for Booth / Voice Talent (Plein Écran Cabine) ─── */}
      {activeTab === "prompter" && filteredWords.length > 0 && (
        <div className="bg-white border-2 border-[#B84A2A] rounded-3xl p-5 sm:p-12 shadow-lg flex flex-col items-center justify-between min-h-[420px] sm:min-h-[500px] text-center gap-6 relative">
          <div className="w-full flex items-center justify-between border-b border-[#E8E5DF] pb-3 gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#B84A2A] text-white font-black text-xs sm:text-sm font-mono tracking-wider shadow-xs">
                {filteredWords[prompterIndex]?.trackLabel}
              </span>
              <span className="text-[11px] sm:text-xs text-[#68645E]">
                {prompterIndex + 1} / {filteredWords.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatus(filteredWords[prompterIndex]?.trackNumber, "recorded")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition border ${
                  trackStatuses[filteredWords[prompterIndex]?.trackNumber] === "recorded"
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Validé</span>
              </button>
              <button
                onClick={() => setStatus(filteredWords[prompterIndex]?.trackNumber, "redo")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition border ${
                  trackStatuses[filteredWords[prompterIndex]?.trackNumber] === "redo"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>À refaire</span>
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className="p-1.5 rounded-xl text-[#68645E] hover:text-[#141416]"
                title="Quitter le prompteur"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Huge Booth Prompter Word */}
          <div className="flex flex-col items-center gap-4 my-auto max-w-4xl px-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#B84A2A]">Mot Éwé à prononcer :</span>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold font-display text-[#141416] tracking-tight leading-tight select-all">
              « {filteredWords[prompterIndex]?.wordEwe} »
            </h2>
            {filteredWords[prompterIndex]?.wordFr && (
              <p className="text-lg sm:text-2xl text-[#68645E] italic">
                Traduction : « {filteredWords[prompterIndex]?.wordFr} »
              </p>
            )}
            {filteredWords[prompterIndex]?.definition && (
              <p className="text-xs sm:text-sm text-[#68645E]/80 max-w-xl">
                {filteredWords[prompterIndex]?.definition}
              </p>
            )}
          </div>

          {/* Prompter Controls Footer */}
          <div className="w-full flex items-center justify-between border-t border-[#E8E5DF] pt-4 gap-2">
            <button
              onClick={() => setPrompterIndex((prev) => Math.max(0, prev - 1))}
              disabled={prompterIndex === 0}
              className="px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E5DF] text-[#141416] font-semibold text-xs sm:text-sm disabled:opacity-30 flex items-center gap-1.5 hover:bg-[#F0EEEA]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <div className="text-xs text-[#68645E] font-medium hidden md:block">
              Appuyez sur <kbd className="px-2 py-0.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded text-[#141416] font-mono">Entrée</kbd> pour valider et passer à la suivante
            </div>

            <button
              onClick={() => setPrompterIndex((prev) => Math.min(filteredWords.length - 1, prev + 1))}
              disabled={prompterIndex === filteredWords.length - 1}
              className="px-5 py-2.5 rounded-xl bg-[#B84A2A] hover:bg-[#A03E22] text-white font-bold text-xs sm:text-sm disabled:opacity-30 flex items-center gap-1.5 shadow-xs"
            >
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Batch Audio Uploader (Déposez les fichiers du studio man) ─── */}
      {activeTab === "upload" && (
        <div className="bg-white border border-[#E8E5DF] rounded-3xl p-4 sm:p-8 shadow-sm flex flex-col gap-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#141416]">
              Importation Automatique des Pistes du Studio
            </h2>
            <p className="text-xs text-[#68645E] mt-1">
              Déposez les fichiers audio du studio (ex: <code className="bg-[#FAF9F6] px-1 py-0.5 rounded border border-[#E8E5DF]">piste_001.wav</code>, <code className="bg-[#FAF9F6] px-1 py-0.5 rounded border border-[#E8E5DF]">002.mp3</code>). Le système associe automatiquement chaque fichier selon son numéro de piste.
            </p>
          </div>

          {/* Dropzone */}
          <label className="border-2 border-dashed border-[#B84A2A]/40 hover:border-[#B84A2A] bg-[#F9EBE6]/30 hover:bg-[#F9EBE6]/50 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition text-center">
            <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-[#B84A2A]" />
            <span className="font-bold text-xs sm:text-sm text-[#141416]">
              Sélectionner ou glisser les fichiers audio
            </span>
            <span className="text-[11px] text-[#68645E]">
              Formats supportés : .wav, .mp3, .webm, .m4a, .ogg
            </span>
            <input
              type="file"
              multiple
              accept="audio/*,.wav,.mp3,.webm,.ogg,.m4a"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
          </label>

          {/* Files Matching List */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E5DF] pb-2 gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#68645E]">
                  {uploadedFiles.length} fichiers détectés
                </span>
                <button
                  onClick={handleBatchUpload}
                  disabled={isBatchUploading || uploadedFiles.every((f) => f.status === "done")}
                  className="px-4 py-2 rounded-xl bg-[#B84A2A] hover:bg-[#A03E22] text-white font-bold text-xs shadow-xs disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isBatchUploading ? "Import en cours..." : "Enregistrer dans la base"}
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {uploadedFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                      item.status === "done"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : item.matchedWord
                        ? "bg-[#FAF9F6] border-[#E8E5DF] text-[#141416]"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#E8E5DF] text-[11px]">
                        {item.trackNum ? `PISTE ${item.trackNum.toString().padStart(3, "0")}` : "Non reconnu"}
                      </span>
                      <span className="font-medium truncate max-w-[180px]">{item.file.name}</span>
                      {item.matchedWord ? (
                        <span className="font-bold text-[#B84A2A]">➔ « {item.matchedWord.wordEwe} » ({item.matchedWord.wordFr})</span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Aucun mot associé</span>
                      )}
                    </div>

                    <div className="self-end sm:self-auto">
                      {item.status === "done" && <span className="font-bold text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Enregistré</span>}
                      {item.status === "uploading" && <span className="font-bold text-[#B84A2A] animate-pulse">Envoi R2...</span>}
                      {item.status === "ready" && <span className="text-[#68645E]">Prêt</span>}
                      {item.status === "error" && <span className="font-bold text-red-600">Erreur</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Main Sequential Grid (Grille Tableau Studio) ─── */}
      {activeTab === "table" && (
        <div className="bg-white border border-[#E8E5DF] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#68645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher piste, mot éwé ou français..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl pl-9 pr-3 py-2 text-xs text-[#141416] focus:outline-none focus:border-[#B84A2A]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68645E]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <div className="flex bg-[#FAF9F6] p-1 rounded-xl border border-[#E8E5DF] text-xs w-full sm:w-auto">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg font-medium transition text-center ${
                    filterMode === "all" ? "bg-white text-[#B84A2A] font-bold shadow-2xs" : "text-[#68645E]"
                  }`}
                >
                  Tous ({words.length})
                </button>
                <button
                  onClick={() => setFilterMode("without_audio")}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg font-medium transition text-center ${
                    filterMode === "without_audio" ? "bg-white text-[#B84A2A] font-bold shadow-2xs" : "text-[#68645E]"
                  }`}
                >
                  Sans audio
                </button>
                <button
                  onClick={() => setFilterMode("with_audio")}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg font-medium transition text-center ${
                    filterMode === "with_audio" ? "bg-white text-[#B84A2A] font-bold shadow-2xs" : "text-[#68645E]"
                  }`}
                >
                  Avec audio
                </button>
              </div>
            </div>
          </div>

          {/* Session Progress Ribbon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#FAF9F6] px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-xs text-[#68645E] gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span>Cochées : <strong className="text-emerald-700">{totalRecordedInSession}</strong></span>
              <span>À refaire : <strong className="text-amber-700">{totalRedoInSession}</strong></span>
              <span>Affichés : <strong>{filteredWords.length} mots</strong></span>
            </div>
            <button
              onClick={async () => {
                if (confirm("Réinitialiser les statuts cochés pour toute l'équipe sur la base de données ?")) {
                  setTrackStatuses({});
                  try {
                    await fetch("/api/studio/words", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "reset_all" }),
                    });
                    fetchWords(false);
                  } catch (err) {
                    console.error("Reset error:", err);
                  }
                }
              }}
              className="text-[11px] text-[#68645E] hover:text-[#B84A2A] underline text-left sm:text-right"
            >
              Réinitialiser les statuts (Équipe)
            </button>
          </div>

          {/* Content Views: Responsive Card List on Mobile + Table on Desktop */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#68645E]">
              <div className="w-8 h-8 border-2 border-[#B84A2A] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Chargement des 1 378 mots numérotés...</p>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="py-16 text-center text-[#68645E] text-xs">
              Aucun mot ne correspond à votre recherche.
            </div>
          ) : (
            <>
              {/* 1. MOBILE CARDS VIEW (block on mobile, hidden on desktop) */}
              <div className="block md:hidden space-y-3">
                {filteredWords.map((word) => {
                  const status = trackStatuses[word.trackNumber] || "pending";
                  return (
                    <div
                      key={word.id}
                      className={`p-4 rounded-2xl border transition flex flex-col gap-3 shadow-2xs ${
                        status === "recorded"
                          ? "bg-emerald-50/50 border-emerald-300"
                          : status === "redo"
                          ? "bg-amber-50/50 border-amber-300"
                          : "bg-white border-[#E8E5DF]"
                      }`}
                    >
                      {/* Top Row: Track Badge + Audio Play */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-[#FAF9F6] border border-[#E8E5DF] text-[#B84A2A] font-black font-mono text-xs shadow-2xs">
                          {word.trackLabel}
                        </span>
                        {word.hasAudio && word.audioUrl ? (
                          <button
                            onClick={() => {
                              const audio = new Audio(word.audioUrl!);
                              audio.play();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F9EBE6] text-[#B84A2A] border border-[#E8E5DF] text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Écouter</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#68645E]/50 font-mono">Sans audio</span>
                        )}
                      </div>

                      {/* Word Info */}
                      <div>
                        <h3 className="font-display font-bold text-xl text-[#141416]">
                          « {word.wordEwe} »
                        </h3>
                        <p className="text-xs font-medium text-[#68645E] mt-0.5">
                          {word.wordFr || <span className="italic text-[#68645E]/50">Pas de traduction</span>}
                        </p>
                        {word.definition && (
                          <p className="text-[11px] text-[#68645E]/70 mt-1 line-clamp-2">
                            {word.definition}
                          </p>
                        )}
                      </div>

                      {/* Bottom Large Touch Action Buttons for Live Studio Session */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E8E5DF]/60">
                        <button
                          onClick={() => setStatus(word.trackNumber, status === "recorded" ? "pending" : "recorded")}
                          className={`min-h-[42px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                            status === "recorded"
                              ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                              : "bg-white text-[#141416] hover:text-emerald-700 border-[#E8E5DF]"
                          }`}
                        >
                          <Check className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                          <span>{status === "recorded" ? "Prise Validée ✅" : "Valider prise"}</span>
                        </button>

                        <button
                          onClick={() => setStatus(word.trackNumber, status === "redo" ? "pending" : "redo")}
                          className={`min-h-[42px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                            status === "redo"
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-white text-[#141416] hover:text-amber-600 border-[#E8E5DF]"
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>{status === "redo" ? "À refaire ⚠️" : "À refaire"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP TABLE VIEW (hidden on mobile, block on md+) */}
              <div className="hidden md:block overflow-x-auto border border-[#E8E5DF] rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-[#E8E5DF] text-[#68645E] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 w-28 text-center font-mono">N° Piste</th>
                      <th className="py-3 px-4 font-display text-sm">Mot Éwé (Texte à lire)</th>
                      <th className="py-3 px-4">Traduction Française</th>
                      <th className="py-3 px-4">Définition / Contexte</th>
                      <th className="py-3 px-4 text-center w-36">Statut Prise</th>
                      <th className="py-3 px-4 text-center w-24">Audio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E5DF]">
                    {filteredWords.map((word) => {
                      const status = trackStatuses[word.trackNumber] || "pending";
                      return (
                        <tr 
                          key={word.id}
                          className={`transition hover:bg-[#FAF9F6]/80 ${
                            status === "recorded" 
                              ? "bg-emerald-50/40" 
                              : status === "redo" 
                              ? "bg-amber-50/40" 
                              : ""
                          }`}
                        >
                          {/* Track Number */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E8E5DF] text-[#B84A2A] font-black">
                              {word.trackLabel}
                            </span>
                          </td>

                          {/* Word Ewe in Corafric font */}
                          <td className="py-3.5 px-4 font-display font-bold text-base text-[#141416]">
                            « {word.wordEwe} »
                          </td>

                          {/* Word French */}
                          <td className="py-3.5 px-4 font-medium text-[#141416]">
                            {word.wordFr || <span className="text-[#68645E]/50 italic">Non renseigné</span>}
                          </td>

                          {/* Definition */}
                          <td className="py-3.5 px-4 text-[#68645E] max-w-xs truncate">
                            {word.definition || "—"}
                          </td>

                          {/* Action Buttons for Studio Man */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setStatus(word.trackNumber, status === "recorded" ? "pending" : "recorded")}
                                className={`p-1.5 rounded-lg text-xs font-bold transition border ${
                                  status === "recorded"
                                    ? "bg-emerald-700 text-white border-emerald-700"
                                    : "bg-white text-[#68645E] hover:text-emerald-700 border-[#E8E5DF]"
                                }`}
                                title="Marquer comme Enregistré (Piste validée)"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setStatus(word.trackNumber, status === "redo" ? "pending" : "redo")}
                                className={`p-1.5 rounded-lg text-xs font-bold transition border ${
                                  status === "redo"
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "bg-white text-[#68645E] hover:text-amber-600 border-[#E8E5DF]"
                                }`}
                                title="Marquer comme À refaire"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Audio play button */}
                          <td className="py-3.5 px-4 text-center">
                            {word.hasAudio && word.audioUrl ? (
                              <button
                                onClick={() => {
                                  const audio = new Audio(word.audioUrl!);
                                  audio.play();
                                }}
                                className="p-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#F9EBE6] text-[#B84A2A] border border-[#E8E5DF] transition"
                                title="Écouter l'enregistrement"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#68645E]/40 font-mono">Sans audio</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
