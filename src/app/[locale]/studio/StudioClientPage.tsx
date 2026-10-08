"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Check, 
  X, 
  Play, 
  Pause, 
  Mic, 
  Square, 
  RotateCcw, 
  Volume2, 
  Search, 
  Music, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw,
  Loader2,
  Sparkles,
  Info,
  Radio
} from "lucide-react";

interface WordItem {
  id: string;
  trackNumber: number;
  trackLabel: string;
  wordEwe: string;
  wordFr: string;
  definition: string;
  partOfSpeech: string;
  hasAudio: boolean;
  audioUrl: string | null;
  status: "pending" | "validated" | "rejected";
  operatorName?: string | null;
}

interface StudioStats {
  total: number;
  validated: number;
  rejected: number;
  pending: number;
  withAudio: number;
}

interface UnassignedStem {
  filename: string;
  url: string;
  isAssigned: boolean;
}

// Audio provenance analyzer
function getAudioBadge(url: string | null): { label: string; badgeClass: string; isLegacyVowel: boolean } | null {
  if (!url) return null;
  if (url.includes("/Stems/")) {
    return { 
      label: "Stem Studio HQ", 
      badgeClass: "text-[#B84A2A] bg-[#F9EBE6] border-[#F2D7CE]", 
      isLegacyVowel: false 
    };
  }
  if (url.endsWith(".mp4") && url.includes("/audios/")) {
    return { 
      label: "Voyelle Initiale", 
      badgeClass: "text-blue-800 bg-blue-50 border-blue-200", 
      isLegacyVowel: true 
    };
  }
  if (url.includes("/recordings/") || url.includes("/api/audio/")) {
    return { 
      label: "Prise Directe", 
      badgeClass: "text-purple-800 bg-purple-50 border-purple-200", 
      isLegacyVowel: false 
    };
  }
  return { 
    label: "Audio lié", 
    badgeClass: "text-[#68645E] bg-[#FAF9F6] border-[#E8E5DF]", 
    isLegacyVowel: false 
  };
}

export function StudioClientPage() {
  // Main Navigation Mode
  const [activeTab, setActiveTab] = useState<"sheet" | "stems">("sheet");

  // Sheet State: Pagination & Filters
  const [words, setWords] = useState<WordItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "validated" | "rejected" | "with_audio" | "without_audio">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingWordId, setIsUpdatingWordId] = useState<string | null>(null);

  // Global Stats
  const [stats, setStats] = useState<StudioStats>({
    total: 0,
    validated: 0,
    rejected: 0,
    pending: 0,
    withAudio: 0,
  });

  // Optimized Audio Playback Engine
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ currentTime: number; duration: number }>({ currentTime: 0, duration: 0 });
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Direct In-line Recording Modal
  const [recordingWord, setRecordingWord] = useState<WordItem | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isSavingAudio, setIsSavingAudio] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stems Matcher State
  const [stems, setStems] = useState<UnassignedStem[]>([]);
  const [currentStemIndex, setCurrentStemIndex] = useState<number>(0);
  const [isLoadingStems, setIsLoadingStems] = useState<boolean>(false);
  const [stemSearchQuery, setStemSearchQuery] = useState<string>("");
  const [stemWordSuggestions, setStemWordSuggestions] = useState<WordItem[]>([]);
  const [selectedWordForStem, setSelectedWordForStem] = useState<WordItem | null>(null);
  const [isMappingStem, setIsMappingStem] = useState<boolean>(false);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      audioCacheRef.current.clear();
    };
  }, []);

  // Preload and retrieve cached audio instance
  const getOrCreateAudio = useCallback((url: string): HTMLAudioElement => {
    const cleanUrl = encodeURI(url);
    let audio = audioCacheRef.current.get(cleanUrl);
    if (!audio) {
      audio = new Audio(cleanUrl);
      audio.preload = "auto";
      audioCacheRef.current.set(cleanUrl, audio);
    }
    return audio;
  }, []);

  // Optimized Play / Pause with time tracking and zero latency
  const handleTogglePlay = useCallback((url: string) => {
    const cleanUrl = encodeURI(url);

    if (playingAudioUrl === cleanUrl) {
      // Pause
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setPlayingAudioUrl(null);
      setPlaybackProgress({ currentTime: 0, duration: 0 });
    } else {
      // Stop previously playing instance
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      const audio = getOrCreateAudio(url);
      currentAudioRef.current = audio;
      setPlayingAudioUrl(cleanUrl);

      audio.currentTime = 0;
      audio.ontimeupdate = () => {
        setPlaybackProgress({
          currentTime: audio.currentTime || 0,
          duration: audio.duration || 0,
        });
      };

      audio.onended = () => {
        setPlayingAudioUrl(null);
        setPlaybackProgress({ currentTime: 0, duration: 0 });
      };

      audio.onerror = () => {
        console.warn("Audio playback error for:", cleanUrl);
        setPlayingAudioUrl(null);
        setPlaybackProgress({ currentTime: 0, duration: 0 });
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Play interrupted or failed:", err);
          setPlayingAudioUrl(null);
          setPlaybackProgress({ currentTime: 0, duration: 0 });
        });
      }
    }
  }, [playingAudioUrl, getOrCreateAudio]);

  // 1. Fetch Words from API with strict pagination
  const fetchWords = useCallback(async (targetPage = page, query = searchQuery, filter = filterMode) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: pageSize.toString(),
        filter,
      });
      if (query.trim()) {
        params.set("q", query.trim());
      }

      const res = await fetch(`/api/studio/words?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();

      setWords(data.words || []);
      setTotalPages(data.totalPages || 1);
      setFilteredTotal(data.filteredTotal || 0);
      if (data.stats) {
        setStats(data.stats);
      }

      // Preload the first few audios in background for instant playback
      if (data.words && Array.isArray(data.words)) {
        data.words.slice(0, 8).forEach((w: WordItem) => {
          if (w.audioUrl) {
            getOrCreateAudio(w.audioUrl);
          }
        });
      }
    } catch (err) {
      console.error("Failed to load studio words:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery, filterMode, getOrCreateAudio]);

  // Initial and param change trigger
  useEffect(() => {
    fetchWords(page, searchQuery, filterMode);
  }, [page, filterMode]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchWords(1, searchQuery, filterMode);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Fast Status Update (Validated / Rejected / Pending)
  const handleUpdateStatus = async (word: WordItem, newStatus: "validated" | "rejected" | "pending") => {
    setIsUpdatingWordId(word.id);
    const prevStatus = word.status;

    // Optimistic UI update
    setWords((prev) =>
      prev.map((w) => (w.id === word.id ? { ...w, status: newStatus } : w))
    );

    // Update global stats optimistically
    setStats((prev) => {
      const next = { ...prev };
      if (prevStatus === "validated") next.validated--;
      if (prevStatus === "rejected") next.rejected--;
      if (prevStatus === "pending") next.pending--;

      if (newStatus === "validated") next.validated++;
      if (newStatus === "rejected") next.rejected++;
      if (newStatus === "pending") next.pending++;
      return next;
    });

    try {
      const operatorName = typeof window !== "undefined" ? localStorage.getItem("corafric_studio_operator") || "Studio" : "Studio";
      const res = await fetch("/api/studio/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: word.id,
          trackNumber: word.trackNumber,
          status: newStatus,
          operatorName,
        }),
      });

      if (!res.ok) {
        // Rollback on error
        setWords((prev) =>
          prev.map((w) => (w.id === word.id ? { ...w, status: prevStatus } : w))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      setWords((prev) =>
        prev.map((w) => (w.id === word.id ? { ...w, status: prevStatus } : w))
      );
    } finally {
      setIsUpdatingWordId(null);
    }
  };

  // 3. Stems Matcher Loader & Adjacent Preloading
  const fetchStems = useCallback(async () => {
    setIsLoadingStems(true);
    try {
      const res = await fetch("/api/studio/unassigned-audios");
      if (!res.ok) throw new Error("Erreur de chargement des pistes stems");
      const data = await res.json();
      const list = (data.audios || []) as UnassignedStem[];
      setStems(list);
      setCurrentStemIndex(0);

      // Preload current and next stems immediately
      if (list[0]) getOrCreateAudio(list[0].url);
      if (list[1]) getOrCreateAudio(list[1].url);
    } catch (err) {
      console.error("Failed to load stems:", err);
    } finally {
      setIsLoadingStems(false);
    }
  }, [getOrCreateAudio]);

  useEffect(() => {
    if (activeTab === "stems" && stems.length === 0) {
      fetchStems();
    }
  }, [activeTab, fetchStems, stems.length]);

  // Current Stem Item
  const currentStem = stems[currentStemIndex] || null;

  // Preload next stem on index change
  useEffect(() => {
    if (stems[currentStemIndex + 1]) {
      getOrCreateAudio(stems[currentStemIndex + 1].url);
    }
  }, [currentStemIndex, stems, getOrCreateAudio]);

  // Search words for current stem match
  const fetchStemWordSuggestions = useCallback(async (query: string) => {
    try {
      const res = await fetch(`/api/studio/pending-words?q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = await res.json();
      setStemWordSuggestions(data.words || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "stems") {
      fetchStemWordSuggestions(stemSearchQuery);
    }
  }, [activeTab, stemSearchQuery, fetchStemWordSuggestions]);

  // Auto-pick default word for stem track number
  useEffect(() => {
    if (currentStem) {
      const match = currentStem.filename.match(/\d+/);
      const trackNum = match ? parseInt(match[0], 10) : null;
      if (trackNum && words.length > 0) {
        const found = words.find((w) => w.trackNumber === trackNum);
        if (found) {
          setSelectedWordForStem(found);
          return;
        }
      }
    }
    setSelectedWordForStem(null);
  }, [currentStemIndex, currentStem, words]);

  // Map Stem to Word & Validate
  const handleMapStem = async () => {
    if (!currentStem || !selectedWordForStem || isMappingStem) return;
    setIsMappingStem(true);
    try {
      const res = await fetch("/api/studio/map-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: selectedWordForStem.id,
          audioUrl: currentStem.url,
        }),
      });

      if (res.ok) {
        // Update local word status
        setWords((prev) =>
          prev.map((w) =>
            w.id === selectedWordForStem.id
              ? { ...w, hasAudio: true, audioUrl: currentStem.url, status: "validated" }
              : w
          )
        );
        setStats((prev) => ({
          ...prev,
          validated: prev.validated + 1,
          withAudio: prev.withAudio + 1,
          pending: Math.max(0, prev.pending - 1),
        }));

        // Stop current audio if playing
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        setPlayingAudioUrl(null);

        // Advance stem
        setStems((prev) => prev.filter((_, idx) => idx !== currentStemIndex));
        setSelectedWordForStem(null);
      }
    } catch (err) {
      console.error("Mapping error:", err);
    } finally {
      setIsMappingStem(false);
    }
  };

  // Keyboard Shortcuts for Stems Mode & Quick Listening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (activeTab === "stems" && currentStem) {
        if (e.code === "Space") {
          e.preventDefault();
          handleTogglePlay(currentStem.url);
        } else if (e.key === "Enter" && selectedWordForStem && !isMappingStem) {
          e.preventDefault();
          handleMapStem();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setCurrentStemIndex((prev) => Math.min(stems.length - 1, prev + 1));
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setCurrentStemIndex((prev) => Math.max(0, prev - 1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, currentStem, selectedWordForStem, isMappingStem, stems.length, handleTogglePlay]);

  // 4. In-line Voice Recording Handlers
  const startRecordingForWord = async (word: WordItem) => {
    setRecordingWord(word);
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false },
      });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setRecordedAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopRecordingForWord = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    }
  };

  const saveRecordedAudio = async () => {
    if (!recordingWord || !recordedBlob || isSavingAudio) return;
    setIsSavingAudio(true);

    try {
      const formData = new FormData();
      formData.append("audio", recordedBlob);
      formData.append("wordId", recordingWord.id);
      formData.append("trackNumber", recordingWord.trackNumber.toString());

      const res = await fetch("/api/studio/upload-track", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setWords((prev) =>
          prev.map((w) =>
            w.id === recordingWord.id
              ? { ...w, hasAudio: true, audioUrl: data.audioUrl, status: "validated" }
              : w
          )
        );
        setStats((prev) => ({
          ...prev,
          validated: prev.validated + 1,
          withAudio: prev.withAudio + 1,
          pending: Math.max(0, prev.pending - 1),
        }));
        setRecordingWord(null);
        setRecordedBlob(null);
        setRecordedAudioUrl(null);
      } else {
        alert("Erreur lors de la sauvegarde du fichier audio.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Erreur réseau lors de la sauvegarde.");
    } finally {
      setIsSavingAudio(false);
    }
  };

  const closeRecordingModal = () => {
    if (isRecording) stopRecordingForWord();
    setRecordingWord(null);
    setRecordedBlob(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
  };

  return (
    <div className="w-full flex flex-col gap-6 py-2 pb-24">
      {/* ─── 1. STUDIO EDITORIAL HEADER & METRICS (Flat, No Cards) ─── */}
      <div className="border-b border-[#E8E5DF] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[#141416] tracking-tight">
              Studio Corafric
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF9F6] text-[#B84A2A] border border-[#E8E5DF]">
              Vocabulaire Éwé
            </span>
          </div>
          <p className="text-xs text-[#68645E] mt-1 max-w-xl">
            Atelier de qualification du lexique, validation des traductions et synchronisation des pistes audio.
          </p>
        </div>

        {/* Flat Segmented Mode Switcher */}
        <div className="flex items-center bg-[#FAF9F6] border border-[#E8E5DF] rounded-lg p-1 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("sheet")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "sheet"
                ? "bg-white text-[#B84A2A] font-bold border border-[#E8E5DF]/70"
                : "text-[#68645E] hover:text-[#141416]"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Feuille de pistes ({stats.total})</span>
          </button>
          <button
            onClick={() => setActiveTab("stems")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "stems"
                ? "bg-white text-[#B84A2A] font-bold border border-[#E8E5DF]/70"
                : "text-[#68645E] hover:text-[#141416]"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Liaison Stems Studio ({stems.length > 0 ? stems.length : "141"})</span>
          </button>
        </div>
      </div>

      {/* ─── 2. FLAT HORIZONTAL METRICS STRIP (Zero Elevated Cards) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 border border-[#E8E5DF] rounded-lg bg-[#FAF9F6] divide-y sm:divide-y-0 sm:divide-x divide-[#E8E5DF] text-center">
        <div className="py-2.5 px-3">
          <span className="block text-lg font-bold font-mono text-[#141416]">{stats.total}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#68645E]">Mots au total</span>
        </div>
        <div className="py-2.5 px-3">
          <span className="block text-lg font-bold font-mono text-emerald-800">{stats.validated}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#68645E]">Validés</span>
        </div>
        <div className="py-2.5 px-3">
          <span className="block text-lg font-bold font-mono text-amber-800">{stats.pending}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#68645E]">En attente</span>
        </div>
        <div className="py-2.5 px-3">
          <span className="block text-lg font-bold font-mono text-rose-800">{stats.rejected}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#68645E]">Rejetés</span>
        </div>
        <div className="col-span-2 sm:col-span-1 py-2.5 px-3">
          <span className="block text-lg font-bold font-mono text-[#B84A2A]">{stats.withAudio}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#68645E]">Avec Audio</span>
        </div>
      </div>

      {/* ─── TAB 1: FEUILLE DE PISTES & VALIDATION (Tableau Épuré) ─── */}
      {activeTab === "sheet" && (
        <div className="flex flex-col gap-4">
          {/* Controls: Search and Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-[#68645E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher mot éwé ou français..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E8E5DF] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#141416] placeholder:text-[#68645E]/70 focus:outline-none focus:border-[#B84A2A]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#68645E] hover:text-[#141416]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Pills (Flat, crisp) */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                onClick={() => { setFilterMode("all"); setPage(1); }}
                className={`px-3 py-1 rounded-md transition font-medium whitespace-nowrap ${
                  filterMode === "all"
                    ? "bg-[#141416] text-white font-semibold"
                    : "bg-[#FAF9F6] border border-[#E8E5DF] text-[#68645E] hover:text-[#141416]"
                }`}
              >
                Tous ({stats.total})
              </button>
              <button
                onClick={() => { setFilterMode("pending"); setPage(1); }}
                className={`px-3 py-1 rounded-md transition font-medium whitespace-nowrap ${
                  filterMode === "pending"
                    ? "bg-amber-800 text-white font-semibold"
                    : "bg-[#FAF9F6] border border-[#E8E5DF] text-[#68645E] hover:text-[#141416]"
                }`}
              >
                En attente ({stats.pending})
              </button>
              <button
                onClick={() => { setFilterMode("validated"); setPage(1); }}
                className={`px-3 py-1 rounded-md transition font-medium whitespace-nowrap ${
                  filterMode === "validated"
                    ? "bg-emerald-800 text-white font-semibold"
                    : "bg-[#FAF9F6] border border-[#E8E5DF] text-[#68645E] hover:text-[#141416]"
                }`}
              >
                Validés ({stats.validated})
              </button>
              <button
                onClick={() => { setFilterMode("rejected"); setPage(1); }}
                className={`px-3 py-1 rounded-md transition font-medium whitespace-nowrap ${
                  filterMode === "rejected"
                    ? "bg-rose-800 text-white font-semibold"
                    : "bg-[#FAF9F6] border border-[#E8E5DF] text-[#68645E] hover:text-[#141416]"
                }`}
              >
                Rejetés ({stats.rejected})
              </button>
              <button
                onClick={() => { setFilterMode("with_audio"); setPage(1); }}
                className={`px-3 py-1 rounded-md transition font-medium whitespace-nowrap ${
                  filterMode === "with_audio"
                    ? "bg-[#B84A2A] text-white font-semibold"
                    : "bg-[#FAF9F6] border border-[#E8E5DF] text-[#68645E] hover:text-[#141416]"
                }`}
              >
                Avec audio ({stats.withAudio})
              </button>
              <button
                onClick={() => { setFilterMode("without_audio"); setPage(1); }}
                className={`px-3 py-1 rounded-md transition font-medium whitespace-nowrap ${
                  filterMode === "without_audio"
                    ? "bg-[#68645E] text-white font-semibold"
                    : "bg-[#FAF9F6] border border-[#E8E5DF] text-[#68645E] hover:text-[#141416]"
                }`}
              >
                Sans audio
              </button>
            </div>
          </div>

          {/* Table Container (Flat borders, Zero Card Elevation) */}
          <div className="border border-[#E8E5DF] rounded-lg bg-white overflow-hidden">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#68645E]">
                <Loader2 className="w-5 h-5 animate-spin text-[#B84A2A]" />
                <span className="text-xs">Chargement instantané...</span>
              </div>
            ) : words.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#68645E]">
                Aucun mot ne correspond aux filtres appliqués.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E5DF] bg-[#FAF9F6] text-[#68645E] text-[11px] font-semibold">
                      <th className="py-2.5 px-3 w-16">Piste</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Mot Éwé</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Français & Définition</th>
                      <th className="py-2.5 px-3 min-w-[170px]">Audio & Provenance</th>
                      <th className="py-2.5 px-3 min-w-[180px] text-right">Décision Opérateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E5DF]">
                    {words.map((word) => {
                      const cleanWordAudioUrl = word.audioUrl ? encodeURI(word.audioUrl) : null;
                      const isPlayingThis = playingAudioUrl === cleanWordAudioUrl;
                      const isUpdating = isUpdatingWordId === word.id;
                      const badgeInfo = getAudioBadge(word.audioUrl);

                      return (
                        <tr
                          key={word.id}
                          className={`hover:bg-[#FAF9F6]/60 transition-colors ${
                            word.status === "validated"
                              ? "bg-emerald-50/20"
                              : word.status === "rejected"
                              ? "bg-rose-50/20 opacity-70"
                              : ""
                          }`}
                        >
                          {/* Track Number */}
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#68645E]">
                            <span className="px-1.5 py-0.5 rounded bg-[#FAF9F6] border border-[#E8E5DF] text-[10px]">
                              {word.trackNumber.toString().padStart(3, "0")}
                            </span>
                          </td>

                          {/* Word Ewe */}
                          <td className="py-2.5 px-3">
                            <span className="font-display font-bold text-sm text-[#141416]">
                              {word.wordEwe}
                            </span>
                            {word.partOfSpeech && (
                              <span className="block text-[10px] text-[#68645E] italic">
                                {word.partOfSpeech}
                              </span>
                            )}
                          </td>

                          {/* French Translation & Definition */}
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-[#141416]">
                              {word.wordFr || <span className="text-[#68645E]/60 italic">Sans traduction</span>}
                            </span>
                            {word.definition && (
                              <p className="text-[11px] text-[#68645E] line-clamp-1 mt-0.5">
                                {word.definition}
                              </p>
                            )}
                          </td>

                          {/* Audio Column: Optimized Player with Provenance Badge */}
                          <td className="py-2.5 px-3">
                            {word.hasAudio && word.audioUrl ? (
                              <div className="flex flex-col gap-1 items-start">
                                <button
                                  onClick={() => handleTogglePlay(word.audioUrl!)}
                                  className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold flex items-center gap-1.5 transition ${
                                    isPlayingThis
                                      ? "bg-[#B84A2A] text-white border-[#B84A2A]"
                                      : "bg-white border-[#E8E5DF] text-[#141416] hover:border-[#B84A2A]"
                                  }`}
                                >
                                  {isPlayingThis ? (
                                    <>
                                      <Pause className="w-3 h-3 fill-current" />
                                      <span>Pause</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3 h-3 fill-current text-[#B84A2A]" />
                                      <span>Écouter</span>
                                    </>
                                  )}
                                </button>
                                {badgeInfo && (
                                  <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${badgeInfo.badgeClass}`}>
                                    {badgeInfo.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => startRecordingForWord(word)}
                                className="px-2.5 py-1 rounded-md border border-dashed border-[#E8E5DF] hover:border-[#B84A2A] text-[11px] text-[#68645E] hover:text-[#B84A2A] flex items-center gap-1 transition bg-white"
                                title="Enregistrer directement au micro"
                              >
                                <Mic className="w-3 h-3" />
                                <span>Enregistrer</span>
                              </button>
                            )}
                          </td>

                          {/* Status & Decision Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Validate button */}
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(word, word.status === "validated" ? "pending" : "validated")}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition border ${
                                  word.status === "validated"
                                    ? "bg-emerald-800 text-white border-emerald-800"
                                    : "bg-white border-[#E8E5DF] text-[#141416] hover:border-emerald-600 hover:text-emerald-800"
                                }`}
                                title={word.status === "validated" ? "Cliquer pour annuler la validation" : "Valider ce mot"}
                              >
                                <Check className="w-3 h-3" />
                                <span>{word.status === "validated" ? "Validé" : "Valider"}</span>
                              </button>

                              {/* Reject button */}
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(word, word.status === "rejected" ? "pending" : "rejected")}
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition border ${
                                  word.status === "rejected"
                                    ? "bg-rose-800 text-white border-rose-800"
                                    : "bg-white border-[#E8E5DF] text-[#68645E] hover:border-rose-600 hover:text-rose-800"
                                }`}
                                title={word.status === "rejected" ? "Cliquer pour annuler le rejet" : "Rejeter ce mot"}
                              >
                                <X className="w-3 h-3" />
                                <span>{word.status === "rejected" ? "Rejeté" : "Rejeter"}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Clean Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#68645E] pt-1">
            <span>
              Affichage de {filteredTotal > 0 ? (page - 1) * pageSize + 1 : 0} à {Math.min(page * pageSize, filteredTotal)} sur {filteredTotal} mots
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-1 rounded-md border border-[#E8E5DF] bg-white text-[#141416] hover:bg-[#FAF9F6] disabled:opacity-40 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>

              <span className="font-semibold text-[#141416]">
                Page {page} / {totalPages}
              </span>

              <button
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 rounded-md border border-[#E8E5DF] bg-white text-[#141416] hover:bg-[#FAF9F6] disabled:opacity-40 flex items-center gap-1 transition"
              >
                <span>Suivant</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: LIAISON DES PISTES STEMS (141 Fichiers Audios Studio) ─── */}
      {activeTab === "stems" && (
        <div className="flex flex-col gap-5">
          <div className="border border-[#E8E5DF] rounded-lg bg-white p-4 sm:p-6 flex flex-col gap-4">
            <div className="border-b border-[#E8E5DF] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold font-display text-[#141416]">
                  Association Rapide des Pistes Studio ({stems.length} fichiers restants)
                </h2>
                <p className="text-xs text-[#68645E] mt-0.5">
                  Écoutez la prise du studio, vérifiez le mot correspondant et validez en un clic.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] text-[#68645E] hidden md:inline">
                  Raccourcis : <kbd className="px-1.5 py-0.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded font-mono text-[10px]">Espace</kbd> Écouter • <kbd className="px-1.5 py-0.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded font-mono text-[10px]">Entrée</kbd> Valider • <kbd className="px-1.5 py-0.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded font-mono text-[10px]">➔</kbd> Passer
                </span>
                <button
                  onClick={fetchStems}
                  className="px-2.5 py-1 rounded-md border border-[#E8E5DF] bg-[#FAF9F6] text-[#68645E] hover:text-[#141416] text-xs flex items-center gap-1.5 transition"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rafraîchir</span>
                </button>
              </div>
            </div>

            {isLoadingStems ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-[#68645E]">
                <Loader2 className="w-5 h-5 animate-spin text-[#B84A2A]" />
                <span className="text-xs">Chargement et mise en mémoire tampon des fichiers studio...</span>
              </div>
            ) : stems.length === 0 ? (
              <div className="py-16 text-center text-xs text-emerald-800">
                🎉 Toutes les pistes audio du studio ont été associées et validées !
              </div>
            ) : !currentStem ? null : (
              <div className="flex flex-col gap-5">
                {/* Current Stem Player & Navigation */}
                <div className="border border-[#E8E5DF] rounded-lg bg-[#FAF9F6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-[#F9EBE6] text-[#B84A2A] flex items-center justify-center shrink-0">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-[#141416] block">
                        {currentStem.filename}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-[#68645E]">
                          Piste {currentStemIndex + 1} sur {stems.length}
                        </span>
                        {playingAudioUrl === encodeURI(currentStem.url) && (
                          <span className="flex items-center gap-1 text-[10px] text-[#B84A2A] font-semibold animate-pulse">
                            <Radio className="w-3 h-3" />
                            <span>En lecture</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePlay(currentStem.url)}
                      className="px-4 py-2 rounded-md bg-[#B84A2A] hover:bg-[#A03E22] text-white text-xs font-bold flex items-center gap-2 transition"
                    >
                      {playingAudioUrl === encodeURI(currentStem.url) ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause [Espace]</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Écouter [Espace]</span>
                        </>
                      )}
                    </button>

                    <button
                      disabled={currentStemIndex >= stems.length - 1}
                      onClick={() => setCurrentStemIndex((prev) => Math.min(stems.length - 1, prev + 1))}
                      className="px-3 py-2 rounded-md border border-[#E8E5DF] bg-white text-[#68645E] hover:text-[#141416] text-xs font-semibold disabled:opacity-40 transition"
                      title="Passer à la piste suivante [Flèche droite]"
                    >
                      Passer ➔
                    </button>
                  </div>
                </div>

                {/* Word Matcher Box */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-[#141416]">
                    Mot ciblé pour cette piste studio :
                  </label>

                  {/* Pre-selected or chosen word */}
                  {selectedWordForStem ? (
                    <div className="border border-emerald-300 bg-emerald-50/40 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-base text-[#141416]">
                            « {selectedWordForStem.wordEwe} »
                          </span>
                          <span className="text-xs text-[#68645E]">
                            — {selectedWordForStem.wordFr}
                          </span>
                          {/* Provenance note if vowel */}
                          {selectedWordForStem.hasAudio && (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                              Note : Ce mot a déjà un audio ({selectedWordForStem.audioUrl?.includes(".mp4") ? "Voyelle initiale" : "Audio existant"}). La liaison remplacera par cette nouvelle prise Studio HQ.
                            </span>
                          )}
                        </div>
                        {selectedWordForStem.definition && (
                          <p className="text-[11px] text-[#68645E] mt-0.5">
                            {selectedWordForStem.definition}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => setSelectedWordForStem(null)}
                          className="text-xs text-[#68645E] hover:text-rose-700 underline px-2 py-1"
                        >
                          Changer de mot
                        </button>
                        <button
                          disabled={isMappingStem}
                          onClick={handleMapStem}
                          className="px-4 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          {isMappingStem ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          <span>Lier & Valider [Entrée]</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#68645E] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Rechercher le mot prononcé dans cet audio..."
                          value={stemSearchQuery}
                          onChange={(e) => setStemSearchQuery(e.target.value)}
                          className="w-full bg-[#FAF9F6] border border-[#E8E5DF] rounded-md pl-8 pr-3 py-2 text-xs text-[#141416] focus:outline-none focus:border-[#B84A2A]"
                        />
                      </div>

                      {/* Suggestions list */}
                      <div className="border border-[#E8E5DF] rounded-lg max-h-48 overflow-y-auto divide-y divide-[#E8E5DF] bg-white">
                        {stemWordSuggestions.length === 0 ? (
                          <div className="py-4 text-center text-xs text-[#68645E]">
                            Tapez le mot éwé prononcé pour l'associer à la piste.
                          </div>
                        ) : (
                          stemWordSuggestions.map((sug) => (
                            <button
                              key={sug.id}
                              onClick={() => setSelectedWordForStem(sug)}
                              className="w-full text-left p-2.5 hover:bg-[#FAF9F6] flex items-center justify-between text-xs transition"
                            >
                              <div>
                                <span className="font-display font-bold text-[#141416]">
                                  {sug.wordEwe}
                                </span>
                                <span className="text-[#68645E] ml-2">
                                  — {sug.wordFr}
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-[#B84A2A]">
                                Sélectionner
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── FLOATING DISCRETE ACTIVE AUDIO PLAYER BAR (Zero elevated cards) ─── */}
      {playingAudioUrl && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E5DF] py-2.5 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentAudioRef.current) currentAudioRef.current.pause();
                setPlayingAudioUrl(null);
              }}
              className="w-8 h-8 rounded-md bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#B84A2A] text-[#141416] flex items-center justify-center transition"
              title="Arrêter"
            >
              <Pause className="w-3.5 h-3.5 fill-current text-[#B84A2A]" />
            </button>
            <div>
              <span className="text-xs font-mono font-bold text-[#141416] block max-w-xs truncate">
                Lecture en cours
              </span>
              <span className="text-[10px] text-[#68645E]">
                {playbackProgress.currentTime.toFixed(1)}s / {playbackProgress.duration > 0 ? playbackProgress.duration.toFixed(1) + "s" : "--"}
              </span>
            </div>
          </div>

          {/* Scrubber Progress Line */}
          <div className="hidden sm:block flex-1 max-w-md bg-[#FAF9F6] border border-[#E8E5DF] h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#B84A2A] transition-all duration-100"
              style={{
                width: playbackProgress.duration > 0 
                  ? `${Math.min(100, (playbackProgress.currentTime / playbackProgress.duration) * 100)}%` 
                  : "0%"
              }}
            />
          </div>

          <button
            onClick={() => {
              if (currentAudioRef.current) currentAudioRef.current.pause();
              setPlayingAudioUrl(null);
            }}
            className="text-xs font-semibold text-[#68645E] hover:text-[#141416]"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ─── DIRECT IN-LINE RECORDING MODAL (Flat, No Elevated Cards) ─── */}
      {recordingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-[#E8E5DF] rounded-lg p-5 sm:p-6 max-w-md w-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-3">
              <div>
                <span className="text-[10px] font-mono font-semibold text-[#68645E]">
                  PISTE {recordingWord.trackNumber.toString().padStart(3, "0")}
                </span>
                <h3 className="font-bold text-base font-display text-[#141416]">
                  Enregistrement Vocal
                </h3>
              </div>
              <button onClick={closeRecordingModal} className="text-[#68645E] hover:text-[#141416]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Word */}
            <div className="text-center py-2">
              <span className="text-2xl sm:text-3xl font-bold font-display text-[#141416] block">
                « {recordingWord.wordEwe} »
              </span>
              <span className="text-xs text-[#68645E] italic mt-1 block">
                {recordingWord.wordFr}
              </span>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-col items-center gap-3 pt-2">
              {isRecording ? (
                <button
                  onClick={stopRecordingForWord}
                  className="px-6 py-2.5 rounded-md bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-2 animate-pulse transition"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Arrêter l'enregistrement</span>
                </button>
              ) : recordedAudioUrl ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const a = new Audio(recordedAudioUrl);
                        a.play();
                      }}
                      className="px-3 py-1.5 rounded-md border border-[#E8E5DF] bg-[#FAF9F6] text-[#141416] hover:bg-[#F0EEEA] text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 text-[#B84A2A] fill-current" />
                      <span>Réécouter</span>
                    </button>
                    <button
                      onClick={() => startRecordingForWord(recordingWord)}
                      className="px-3 py-1.5 rounded-md border border-[#E8E5DF] bg-[#FAF9F6] text-[#68645E] hover:text-[#141416] text-xs font-medium flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Recommencer</span>
                    </button>
                  </div>

                  <button
                    disabled={isSavingAudio}
                    onClick={saveRecordedAudio}
                    className="w-full py-2 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    {isSavingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Valider et Enregistrer l'audio</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startRecordingForWord(recordingWord)}
                  className="px-6 py-2.5 rounded-md bg-[#B84A2A] hover:bg-[#A03E22] text-white font-bold text-xs flex items-center gap-2 transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Commencer l'enregistrement</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
