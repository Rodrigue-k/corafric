"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, 
  Square, 
  Play, 
  RotateCcw, 
  Send, 
  SkipForward, 
  Flag, 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  Volume2, 
  Zap, 
  Edit3,
  X
} from "lucide-react";

interface Sentence {
  id: string;
  text: string;
  language: string;
  translationFr: string;
  domain: string;
  lengthCategory: string;
}

interface StudioStats {
  sessionCount: number;
  sessionDurationMs: number;
  sessionFlaggedCount: number;
  sessionStartTime: number;
}

export function StudioClientPage() {
  // Queue and current item
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDurationMs, setRecordingDurationMs] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0);

  // Studio metadata and settings
  const [operatorName, setOperatorName] = useState<string>("Studio Opérateur");
  const [speakerGender, setSpeakerGender] = useState<string>("homme");
  const [speakerAgeGroup, setSpeakerAgeGroup] = useState<string>("30-49");
  const [dialectVariant, setDialectVariant] = useState<string>("ewe_lome");
  const [micType, setMicType] = useState<string>("studio_xlr_usb");
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Inline editing
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>("");
  const [editedTranslation, setEditedTranslation] = useState<string>("");

  // Flag modal
  const [showFlagModal, setShowFlagModal] = useState<boolean>(false);
  const [flagReason, setFlagReason] = useState<string>("bad_translation");
  const [flagFix, setFlagFix] = useState<string>("");
  const [flagNotes, setFlagNotes] = useState<string>("");
  const [isFlagging, setIsFlagging] = useState<boolean>(false);

  // Session stats
  const [stats, setStats] = useState<StudioStats>({
    sessionCount: 0,
    sessionDurationMs: 0,
    sessionFlaggedCount: 0,
    sessionStartTime: Date.now(),
  });

  // Audio player and recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load saved operator preferences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOp = localStorage.getItem("corafric_studio_operator");
      if (savedOp) setOperatorName(savedOp);
      const savedGender = localStorage.getItem("corafric_studio_gender");
      if (savedGender) setSpeakerGender(savedGender);
      const savedAge = localStorage.getItem("corafric_studio_age");
      if (savedAge) setSpeakerAgeGroup(savedAge);
      const savedDialect = localStorage.getItem("corafric_studio_dialect");
      if (savedDialect) setDialectVariant(savedDialect);
      const savedMic = localStorage.getItem("corafric_studio_mic");
      if (savedMic) setMicType(savedMic);
    }
  }, []);

  const saveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("corafric_studio_operator", operatorName);
      localStorage.setItem("corafric_studio_gender", speakerGender);
      localStorage.setItem("corafric_studio_age", speakerAgeGroup);
      localStorage.setItem("corafric_studio_dialect", dialectVariant);
      localStorage.setItem("corafric_studio_mic", micType);
    }
    setShowSettings(false);
  };

  // Fetch sentence batch from API
  const fetchSentences = useCallback(async (limit = 10) => {
    try {
      const res = await fetch(`/api/studio/next?limit=${limit}`);
      if (!res.ok) throw new Error("Erreur de chargement des phrases");
      const data = await res.json();
      return (data.sentences as Sentence[]) || [];
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      const initial = await fetchSentences(10);
      if (isMounted) {
        setSentences(initial);
        setCurrentIndex(0);
        setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [fetchSentences]);

  const currentSentence = sentences[currentIndex] || null;

  // Initialize edited values when sentence changes
  useEffect(() => {
    if (currentSentence) {
      setEditedText(currentSentence.text);
      setEditedTranslation(currentSentence.translationFr);
      setIsEditing(false);
    }
  }, [currentSentence]);

  // Prefetch when reaching near end of local queue
  useEffect(() => {
    if (sentences.length > 0 && currentIndex >= sentences.length - 3) {
      (async () => {
        const more = await fetchSentences(10);
        if (more.length > 0) {
          setSentences((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newUnique = more.filter((s) => !existingIds.has(s.id));
            return [...prev, ...newUnique];
          });
        }
      })();
    }
  }, [currentIndex, sentences, fetchSentences]);

  // Clean up audio URL
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Clean up stream and audio context
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      setErrorMsg(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const avg = sum / dataArray.length;
          setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else {
          mimeType = "";
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          setAudioVolume(0);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordingDurationMs(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDurationMs(Date.now() - startTimeRef.current);
      }, 50);

    } catch (err) {
      console.error("Failed to start recording:", err);
      setErrorMsg("Impossible d'accéder au microphone. Vérifiez les autorisations de votre navigateur.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Replay audio
  const replayAudio = () => {
    if (audioUrl) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        audio.play();
      }
    }
  };

  // Submit audio and advance to next
  const submitAndNext = async () => {
    if (!audioBlob || !currentSentence || isUploading) return;

    const recordedDuration = recordingDurationMs;
    const blobToUpload = audioBlob;
    const sentenceToRecord = currentSentence;

    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDurationMs(0);
    setCurrentIndex((prev) => prev + 1);

    setStats((prev) => ({
      ...prev,
      sessionCount: prev.sessionCount + 1,
      sessionDurationMs: prev.sessionDurationMs + recordedDuration,
    }));

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", blobToUpload, `studio_${sentenceToRecord.id}.webm`);
      formData.append("sentenceId", sentenceToRecord.id);
      formData.append("durationMs", recordedDuration.toString());
      formData.append("speakerGender", speakerGender);
      formData.append("speakerAgeGroup", speakerAgeGroup);
      formData.append("dialectVariant", dialectVariant);
      formData.append("micType", micType);
      formData.append("isStudio", "true");

      const res = await fetch("/api/recordings/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Background upload failed for sentence:", sentenceToRecord.id);
      }
    } catch (err) {
      console.error("Background upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Skip current sentence
  const skipSentence = () => {
    if (isRecording) stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDurationMs(0);
    setCurrentIndex((prev) => prev + 1);
  };

  // Submit flag
  const submitFlag = async () => {
    if (!currentSentence || isFlagging) return;

    setIsFlagging(true);
    try {
      const res = await fetch("/api/studio/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentenceId: currentSentence.id,
          reason: flagReason,
          suggestedFix: flagFix,
          notes: flagNotes,
          operatorName,
        }),
      });

      if (res.ok) {
        setStats((prev) => ({
          ...prev,
          sessionFlaggedCount: prev.sessionFlaggedCount + 1,
        }));
        setShowFlagModal(false);
        setFlagFix("");
        setFlagNotes("");
        skipSentence();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Erreur lors du signalement.");
      }
    } catch (err) {
      console.error("Flag error:", err);
      setErrorMsg("Erreur réseau lors du signalement.");
    } finally {
      setIsFlagging(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (e.key === "Escape") {
          setShowFlagModal(false);
          setIsEditing(false);
          setShowSettings(false);
        }
        return;
      }

      if (showFlagModal) {
        if (e.key === "1") setFlagReason("bad_translation");
        if (e.key === "2") setFlagReason("unintelligible_text");
        if (e.key === "3") setFlagReason("spelling_error");
        if (e.key === "4") setFlagReason("other");
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submitFlag();
        }
        if (e.key === "Escape") {
          setShowFlagModal(false);
        }
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        toggleRecording();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (audioBlob && !isRecording) {
          submitAndNext();
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        replayAudio();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (isRecording) stopRecording();
        setShowFlagModal(true);
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsEditing((prev) => !prev);
      } else if (e.key === "Escape" || e.key === "ArrowRight") {
        e.preventDefault();
        skipSentence();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const sessionElapsedMinutes = Math.max(1, (Date.now() - stats.sessionStartTime) / 60000);
  const hourlyRate = Math.round((stats.sessionCount / sessionElapsedMinutes) * 60);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Studio HUD and Session Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-100">Studio Haute Cadence</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Mode Opérateur Actif
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Opérateur : <span className="text-slate-200 font-medium">{operatorName}</span> • Micro : <span className="text-slate-200">{micType === "studio_xlr_usb" ? "Studio Pro" : "Micro standard"}</span>
            </p>
          </div>
        </div>

        {/* Real-time Session Metrics */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 w-full md:w-auto text-center">
          <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
            <span className="block text-xl sm:text-2xl font-black text-amber-400">{stats.sessionCount}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Enregistrées</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
            <span className="block text-xl sm:text-2xl font-black text-emerald-400">{formatTime(stats.sessionDurationMs)}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Audio Net</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
            <span className="block text-xl sm:text-2xl font-black text-cyan-400">{hourlyRate}/h</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cadence</span>
          </div>
          <div className="hidden sm:block bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
            <span className="block text-xl sm:text-2xl font-black text-rose-400">{stats.sessionFlaggedCount}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Mises à l'écart</span>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
          title="Paramètres de session"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden lg:inline">Paramètres</span>
        </button>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 text-white flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              Paramètres du Profil Studio et Locuteur
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nom ou ID Opérateur</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Sexe du locuteur</label>
              <select
                value={speakerGender}
                onChange={(e) => setSpeakerGender(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="non_precise">Non précisé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Variante Dialectale</label>
              <select
                value={dialectVariant}
                onChange={(e) => setDialectVariant(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ewe_lome">Éwé Standard / Lomé</option>
                <option value="ewe_anlo">Éwé Anlo</option>
                <option value="ewe_kpando">Éwé Kpando</option>
                <option value="ewe_kpalime">Éwé Kpalimé</option>
                <option value="ewe_autre">Autre variante</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Type de Microphone</label>
              <select
                value={micType}
                onChange={(e) => setMicType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="studio_xlr_usb">Micro Studio Professionnel (XLR ou USB)</option>
                <option value="headset_pro">Casque micro avec bonnette</option>
                <option value="integrated">Microphone intégré</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={saveSettings}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Enregistrer les préférences
            </button>
          </div>
        </div>
      )}

      {/* Main Recording Studio Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col gap-8 relative overflow-hidden">
        {isRecording && (
          <div className="absolute inset-0 bg-rose-500/5 pointer-events-none animate-pulse" />
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">×</button>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-base">Chargement du corpus haute cadence...</p>
          </div>
        ) : !currentSentence ? (
          <div className="py-16 text-center flex flex-col items-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Toutes les phrases ont été traitées !</h2>
            <p className="text-slate-500 max-w-md">
              Félicitations à l'équipe. Toutes les phrases disponibles dans cette session ont été enregistrées ou qualifiées.
            </p>
          </div>
        ) : (
          <>
            {/* Sentence Header and Domain */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50 uppercase tracking-wider">
                  Langue : Éwé (ee)
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Domaine : {currentSentence.domain || "Général"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isEditing 
                      ? "bg-amber-500 text-slate-950" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                  title="Touche [E] pour éditer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Mode Édition" : "Corriger le texte [E]"}</span>
                </button>
                <button
                  onClick={() => { if (isRecording) stopRecording(); setShowFlagModal(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition"
                  title="Touche [F] pour signaler"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Mettre de côté [F]</span>
                </button>
              </div>
            </div>

            {/* Main Sentence Prompter View */}
            <div className="flex flex-col gap-5 my-2">
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-amber-600 dark:text-amber-400">Texte Éwé à prononcer :</label>
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={3}
                    className="w-full text-xl sm:text-2xl font-bold p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-amber-500 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <label className="text-xs font-bold text-slate-500">Traduction française de référence :</label>
                  <input
                    type="text"
                    value={editedTranslation}
                    onChange={(e) => setEditedTranslation(e.target.value)}
                    className="w-full text-base p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-relaxed tracking-wide select-all">
                    {editedText || currentSentence.text}
                  </h1>
                  {(editedTranslation || currentSentence.translationFr) && (
                    <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-base sm:text-lg italic font-normal bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 not-italic mr-2">Sens :</span>
                      <span>« {editedTranslation || currentSentence.translationFr} »</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Audio VU-meter and Volume Waveform */}
            {isRecording && (
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <Volume2 className="w-5 h-5 text-rose-500 animate-bounce" />
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75"
                    style={{ width: `${Math.max(5, audioVolume)}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 min-w-[50px] text-right">
                  {formatTime(recordingDurationMs)}
                </span>
              </div>
            )}

            {/* Control Bar and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={replayAudio}
                  disabled={!audioBlob || isRecording}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2 transition"
                  title="Touche [R]"
                >
                  <Play className="w-4 h-4 text-emerald-500" />
                  <span>Réécouter [R]</span>
                </button>
                <button
                  onClick={skipSentence}
                  disabled={isRecording}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium disabled:opacity-30 flex items-center justify-center gap-1.5 transition"
                  title="Touche [Échap] ou [Flèche droite]"
                >
                  <SkipForward className="w-4 h-4" />
                  <span className="hidden md:inline">Passer</span>
                </button>
              </div>

              <button
                onClick={toggleRecording}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                    : audioBlob
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950"
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-6 h-6 fill-current" />
                    <span>ARRÊTER [Espace]</span>
                  </>
                ) : audioBlob ? (
                  <>
                    <RotateCcw className="w-6 h-6" />
                    <span>RÉENREGISTRER [Espace]</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span>ENREGISTRER [Espace]</span>
                  </>
                )}
              </button>

              <button
                onClick={submitAndNext}
                disabled={!audioBlob || isRecording || isUploading}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 disabled:pointer-events-none transition active:scale-95"
                title="Touche [Entrée]"
              >
                <Send className="w-4 h-4" />
                <span>VALIDER ET SUIVANTE [Entrée]</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Keyboard Shortcuts Reference Helper Footer */}
      <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm font-mono font-bold text-slate-800 dark:text-slate-200">Espace</kbd>
          <span>Enregistrer / Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm font-mono font-bold text-slate-800 dark:text-slate-200">Entrée</kbd>
          <span>Valider et Suivante</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm font-mono font-bold text-slate-800 dark:text-slate-200">R</kbd>
          <span>Réécouter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm font-mono font-bold text-slate-800 dark:text-slate-200">F</kbd>
          <span>Mettre de côté</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm font-mono font-bold text-slate-800 dark:text-slate-200">E</kbd>
          <span>Corriger le texte</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm font-mono font-bold text-slate-800 dark:text-slate-200">Échap / ➔</kbd>
          <span>Passer</span>
        </div>
      </div>

      {/* Flag and Set Aside Modal */}
      {showFlagModal && currentSentence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg">
                <AlertTriangle className="w-5 h-5" />
                <span>Mettre la phrase de côté</span>
              </div>
              <button onClick={() => setShowFlagModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 text-sm">
              <p className="font-bold text-slate-900 dark:text-white line-clamp-2">{currentSentence.text}</p>
              {currentSentence.translationFr && (
                <p className="text-xs text-slate-500 italic mt-1">{currentSentence.translationFr}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Motif du signalement (Touche 1, 2, 3 ou 4) :
              </label>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  flagReason === "bad_translation" 
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 font-semibold text-amber-900 dark:text-amber-200" 
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
                  <input
                    type="radio"
                    name="flagReason"
                    value="bad_translation"
                    checked={flagReason === "bad_translation"}
                    onChange={() => setFlagReason("bad_translation")}
                    className="accent-amber-500"
                  />
                  <span>[1] Traduction française incorrecte ou fausse</span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  flagReason === "unintelligible_text" 
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 font-semibold text-amber-900 dark:text-amber-200" 
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
                  <input
                    type="radio"
                    name="flagReason"
                    value="unintelligible_text"
                    checked={flagReason === "unintelligible_text"}
                    onChange={() => setFlagReason("unintelligible_text")}
                    className="accent-amber-500"
                  />
                  <span>[2] Phrase éwé incompréhensible ou insensée</span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  flagReason === "spelling_error" 
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 font-semibold text-amber-900 dark:text-amber-200" 
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
                  <input
                    type="radio"
                    name="flagReason"
                    value="spelling_error"
                    checked={flagReason === "spelling_error"}
                    onChange={() => setFlagReason("spelling_error")}
                    className="accent-amber-500"
                  />
                  <span>[3] Faute d'orthographe ou de ponctuation</span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  flagReason === "other" 
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 font-semibold text-amber-900 dark:text-amber-200" 
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
                  <input
                    type="radio"
                    name="flagReason"
                    value="other"
                    checked={flagReason === "other"}
                    onChange={() => setFlagReason("other")}
                    className="accent-amber-500"
                  />
                  <span>[4] Autre raison</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Correction suggérée (Optionnel) :
              </label>
              <input
                type="text"
                value={flagFix}
                onChange={(e) => setFlagFix(e.target.value)}
                placeholder="Ex: Nouvelle traduction ou correction du mot..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs"
              >
                Annuler [Échap]
              </button>
              <button
                onClick={submitFlag}
                disabled={isFlagging}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2"
              >
                {isFlagging ? "Mise de côté..." : "Confirmer et passer [Entrée]"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
