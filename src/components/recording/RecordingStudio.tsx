"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { DictionaryWord } from "@/types";
import { Button } from "../ui/Button";
import { WordDisplay } from "./WordDisplay";
import { CustomAudioPlayer } from "./CustomAudioPlayer";
import { AudioVisualizer } from "./AudioVisualizer";
import { Card } from "../ui/Card";
import { Mic, Square, RotateCcw, Send, CheckCircle, AlertCircle, SkipForward, Flag } from "lucide-react";

import { cleanAudioBlob } from "@/lib/audioProcessing";

type StudioState = "idle" | "recording" | "recorded" | "cleaning" | "submitting" | "submitted";

export const RecordingStudio: React.FC = () => {
  const t = useTranslations("contribute");
  const [studioState, setStudioState] = useState<StudioState>("idle");
  const [word, setWord] = useState<DictionaryWord | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recording audio resources
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Recording stats
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNextWord = async () => {
    try {
      setIsLoadingWord(true);
      setErrorMessage(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingSeconds(0);
      setStudioState("idle");

      const res = await fetch("/api/words/next");
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setWord(data.word);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setIsLoadingWord(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch("/api/words/next");
        const data = await res.json();
        if (!ignore) {
          if (data.error) throw new Error(data.error);
          setWord(data.word);
        }
      } catch (err: unknown) {
        if (!ignore) setErrorMessage(err instanceof Error ? err.message : "Erreur.");
      } finally {
        if (!ignore) setIsLoadingWord(false);
      }
    }
    void loadInitial();
    return () => {
      ignore = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const [audioDuration, setAudioDuration] = useState<number>(0);

  const startRecording = async () => {
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
    if (!audioBlob || !word) return;

    try {
      setStudioState("submitting");
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("wordId", word.id);
      const finalDuration = audioDuration > 0 ? audioDuration * 1000 : recordingSeconds * 1000;
      formData.append("durationMs", Math.round(finalDuration).toString());

      const res = await fetch("/api/recordings/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setStudioState("submitted");

      setTimeout(() => {
        void fetchNextWord();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de soumission.");
      setStudioState("recorded");
    }
  };

  if (isLoadingWord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-text-muted">Chargement...</p>
      </div>
    );
  }

  if (errorMessage && studioState === "idle") {
    return (
      <Card className="max-w-xl mx-auto p-8 border-red-200 bg-red-50/50 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-semibold text-red-800">Erreur</h3>
        <p className="text-sm text-red-700">{errorMessage}</p>
        <Button onClick={fetchNextWord} variant="primary">
          Réessayer
        </Button>
      </Card>
    );
  }

  if (!word) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-6">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
        <h3 className="text-2xl font-bold">Tous les mots ont été enregistrés</h3>
        <p className="text-sm text-text-muted">
          Merci pour votre contribution !
        </p>
        <Button onClick={fetchNextWord} variant="primary">
          Actualiser
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Word display */}
      <WordDisplay word={word} />

      {/* Recording Studio Status */}
      <Card className="p-5 flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
        {studioState === "idle" && (
          <div className="text-center space-y-6 w-full">
            <AudioVisualizer stream={null} isRecording={false} />
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={startRecording}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-md"
              >
                <Mic className="w-5 h-5 mr-2" />
                {t("startRecording")}
              </Button>
              <button
                onClick={fetchNextWord}
                className="text-xs text-text-muted hover:text-foreground transition-colors flex items-center gap-1 py-1 px-3"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Passer au mot suivant
              </button>
            </div>
          </div>
        )}

        {studioState === "recording" && (
          <div className="text-center space-y-6 w-full">
            <AudioVisualizer stream={mediaStream} isRecording={true} />
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-950/40 rounded-full text-red-700 dark:text-red-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                {recordingSeconds}s
              </div>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Square className="w-5 h-5 mr-2 fill-white" />
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
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
              <Button
                onClick={resetRecording}
                variant="secondary"
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
                onClick={fetchNextWord}
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
          <div className="text-center py-8 space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-text-muted">Traitement audio en cours...</p>
          </div>
        )}

        {studioState === "submitting" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <p className="text-body text-text-muted">{t("submitting")}</p>
          </div>
        )}

        {studioState === "submitted" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-h3 font-semibold text-green-700">{t("success")}</p>
            <p className="text-caption text-text-muted">{t("nextPhrase")}...</p>
          </div>
        )}

        {errorMessage && studioState !== "idle" && (
          <div className="w-full p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2 mt-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </Card>
    </div>
  );
};
