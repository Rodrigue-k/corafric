"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { Sentence } from "@/types";
import { Button } from "../ui/Button";
import { SentenceDisplay } from "./SentenceDisplay";
import { CustomAudioPlayer } from "./CustomAudioPlayer";
import { AudioVisualizer } from "./AudioVisualizer";
import { AnonymousGateModal } from "./AnonymousGateModal";
import { Mic, Square, RotateCcw, Send, CheckCircle, AlertCircle, SkipForward, ArrowLeft } from "lucide-react";
import { cleanAudioBlob } from "@/lib/audioProcessing";

type StudioState = "idle" | "recording" | "recorded" | "cleaning" | "submitting" | "submitted";


interface SentenceRecordingStudioProps {
  onBack?: () => void;
}

export const SentenceRecordingStudio: React.FC<SentenceRecordingStudioProps> = ({ onBack }) => {
  const t = useTranslations("contribute");
  const { isSignedIn } = useAuth();
  const [studioState, setStudioState] = useState<StudioState>("idle");
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [isLoadingSentence, setIsLoadingSentence] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGateModalOpen, setIsGateModalOpen] = useState<boolean>(false);
  const [guestRecordingsCount, setGuestRecordingsCount] = useState<number>(0);

  // Recording audio resources
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Recording stats
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("corafric_guest_records_count");
      if (stored) {
        setGuestRecordingsCount(parseInt(stored, 10) || 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchNextSentence = async () => {
    try {
      setIsLoadingSentence(true);
      setErrorMessage(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingSeconds(0);
      setStudioState("idle");

      const res = await fetch("/api/sentences/next");
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSentence(data.sentence);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors du chargement de la phrase.");
    } finally {
      setIsLoadingSentence(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch("/api/sentences/next");
        const data = await res.json();
        if (!ignore) {
          if (data.error) throw new Error(data.error);
          setSentence(data.sentence);
        }
      } catch (err: unknown) {
        if (!ignore) setErrorMessage(err instanceof Error ? err.message : "Erreur.");
      } finally {
        if (!ignore) setIsLoadingSentence(false);
      }
    }
    void loadInitial();
    return () => {
      ignore = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (!isSignedIn && guestRecordingsCount >= 3) {
      setIsGateModalOpen(true);
      return;
    }

    try {
      setErrorMessage(null);
      setAudioDuration(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const rawBlob = new Blob(chunks, { type: mimeType });
        try {
          setStudioState("cleaning");
          const cleaned = await cleanAudioBlob(rawBlob);
          setAudioBlob(cleaned);
          setAudioUrl(URL.createObjectURL(cleaned));
          setStudioState("recorded");
        } catch (err) {
          console.error("Audio cleaning error, using raw audio:", err);
          setAudioBlob(rawBlob);
          setAudioUrl(URL.createObjectURL(rawBlob));
          setStudioState("recorded");
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setStudioState("recording");

      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error("Microphone access denied:", err);
      setErrorMessage("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setAudioDuration(0);
    setStudioState("idle");
  };

  const submitRecording = async () => {
    if (!audioBlob || !sentence) return;

    try {
      setStudioState("submitting");
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("sentenceId", sentence.id);
      const finalDuration = audioDuration > 0 ? audioDuration * 1000 : recordingSeconds * 1000;
      formData.append("durationMs", Math.round(finalDuration).toString());

      const res = await fetch("/api/recordings/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        const message = data.reason || data.error;
        throw new Error(message);
      }

      setStudioState("submitted");

      if (!isSignedIn) {
        const newCount = guestRecordingsCount + 1;
        setGuestRecordingsCount(newCount);
        try {
          localStorage.setItem("corafric_guest_records_count", newCount.toString());
        } catch {
          // ignore
        }

        if (newCount >= 3) {
          setTimeout(() => {
            setIsGateModalOpen(true);
          }, 1200);
        }
      }

      setTimeout(() => {
        void fetchNextSentence();
      }, 1400);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de soumission.");
      setStudioState("recorded");
    }
  };

  if (isLoadingSentence) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-text-muted">Chargement de la phrase...</p>
      </div>
    );
  }

  if (errorMessage && studioState === "idle") {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-base font-semibold text-foreground">Une erreur est survenue</h3>
        <p className="text-xs text-text-muted">{errorMessage}</p>
        <Button onClick={fetchNextSentence} variant="primary" size="sm">
          Réessayer
        </Button>
      </div>
    );
  }

  if (!sentence) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4 border-y border-border/50">
        <CheckCircle className="w-10 h-10 text-primary mx-auto" />
        <h3 className="text-3xl font-bold font-display text-foreground tracking-tight">Corpus complété</h3>
        <p className="text-sm text-text-muted">
          Toutes les phrases disponibles ont été enregistrées pour cette session.
        </p>
        <div className="pt-4">
          <Button onClick={fetchNextSentence} variant="primary" size="lg">
            Vérifier à nouveau
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Header & Back Switch */}
      <div className="flex items-center justify-between gap-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-black/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Changer de format
          </button>
        ) : <div />}
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 font-display">
          Corpus Textuel
        </span>
      </div>

      {/* Sentence display */}
      <SentenceDisplay sentence={sentence} />

      {/* Recording Studio Status */}
      <div className="pt-8 flex flex-col items-center justify-center space-y-4">
        {studioState === "idle" && (
          <div className="text-center space-y-6 w-full">
            <AudioVisualizer stream={null} isRecording={false} />
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={startRecording}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-8"
              >
                <Mic className="w-4 h-4 mr-2" />
                {t("startRecording")}
              </Button>
              <button
                onClick={fetchNextSentence}
                className="text-xs text-text-muted hover:text-foreground transition-colors flex items-center gap-1 py-1 px-2"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Passer cette phrase
              </button>
            </div>
          </div>
        )}

        {studioState === "recording" && (
          <div className="text-center space-y-6 w-full">
            <AudioVisualizer stream={mediaStream} isRecording={true} />
            <div className="flex flex-col items-center gap-3">
              <div className="text-xs font-mono text-text-muted">
                Enregistrement en cours · {recordingSeconds}s
              </div>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto px-8"
              >
                <Square className="w-4 h-4 mr-2 fill-white" />
                {t("stopRecording")}
              </Button>
            </div>
          </div>
        )}

        {studioState === "recorded" && (
          <div className="text-center space-y-4 w-full">
            {audioUrl && (
              <CustomAudioPlayer
                src={audioUrl}
                durationInSeconds={audioDuration}
              />
            )}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 w-full pt-2">
              <Button
                onClick={resetRecording}
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("retry")}
              </Button>
              <Button
                onClick={submitRecording}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                {t("submit")}
              </Button>
              <Button
                onClick={fetchNextSentence}
                variant="ghost"
                size="md"
                className="w-full sm:w-auto text-text-muted hover:text-foreground"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Passer
              </Button>
            </div>
          </div>
        )}

        {studioState === "cleaning" && (
          <div className="text-center py-6 space-y-3">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Optimisation de l'enregistrement...</p>
          </div>
        )}

        {studioState === "submitting" && (
          <div className="text-center py-6 space-y-3">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-text-muted">{t("submitting")}</p>
          </div>
        )}

        {studioState === "submitted" && (
          <div className="text-center py-6 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FAF8F5] text-primary flex items-center justify-center mx-auto border border-border">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("success")}</p>
            <p className="text-xs text-text-muted">Chargement de la phrase suivante...</p>
          </div>
        )}

        {errorMessage && studioState !== "idle" && (
          <div className="w-full p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Anonymous Gate Modal */}
      <AnonymousGateModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
      />
    </div>
  );
};
