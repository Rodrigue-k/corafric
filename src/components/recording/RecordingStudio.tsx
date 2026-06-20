"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Sentence } from "@/types";
import { Button } from "../ui/Button";
import { SentenceDisplay } from "./SentenceDisplay";
import { AudioVisualizer } from "./AudioVisualizer";
import { Card } from "../ui/Card";
import { Mic, Square, RotateCcw, Send, CheckCircle, AlertCircle } from "lucide-react";

type StudioState = "idle" | "recording" | "recorded" | "submitting" | "submitted";

export const RecordingStudio: React.FC = () => {
  const t = useTranslations("contribute");
  const [studioState, setStudioState] = useState<StudioState>("idle");
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [isLoadingSentence, setIsLoadingSentence] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recording audio resources
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Recording stats
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur.");
    } finally {
      setIsLoadingSentence(false);
    }
  };

  useEffect(() => {
    fetchNextSentence();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMessage(null);
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

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setStudioState("recording");

      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
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

    setStudioState("recorded");
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setStudioState("idle");
  };

  const submitRecording = async () => {
    if (!audioBlob || !sentence) return;

    try {
      setStudioState("submitting");
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("sentenceId", sentence.id);
      formData.append("durationMs", (recordingSeconds * 1000).toString());

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
        fetchNextSentence();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de soumission.");
      setStudioState("recorded");
    }
  };

  if (isLoadingSentence) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-body text-text-muted">Chargement...</p>
      </div>
    );
  }

  if (errorMessage && studioState === "idle") {
    return (
      <Card className="max-w-xl mx-auto p-8 border-red-200 bg-red-50/50 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-h3 font-semibold text-red-800">Erreur</h3>
        <p className="text-body text-red-700">{errorMessage}</p>
        <Button onClick={fetchNextSentence} variant="primary">
          Réessayer
        </Button>
      </Card>
    );
  }

  if (!sentence) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-h1">Félicitations !</h3>
        <p className="text-body text-text-muted">
          Toutes les phrases ont été enregistrées.
        </p>
        <Button onClick={fetchNextSentence} variant="primary">
          Actualiser
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Phrase display */}
      <SentenceDisplay sentence={sentence} />

      {/* Recording Studio Status */}
      <Card className="p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        {studioState === "idle" && (
          <div className="text-center space-y-6 w-full">
            <AudioVisualizer stream={null} isRecording={false} />
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={startRecording}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-lg shadow-primary/20"
              >
                <Mic className="w-5 h-5 mr-2" />
                {t("startRecording")}
              </Button>
              <button
                onClick={fetchNextSentence}
                className="text-caption text-text-muted hover:text-primary transition-colors hover:underline"
              >
                {t("skip")}
              </button>
            </div>
          </div>
        )}

        {studioState === "recording" && (
          <div className="text-center space-y-6 w-full">
            <AudioVisualizer stream={mediaStream} isRecording={true} />
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full text-red-700 animate-pulse text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 block" />
                {recordingSeconds}s
              </div>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto shadow-lg shadow-red-600/20 animate-pulse"
              >
                <Square className="w-5 h-5 mr-2 fill-white" />
                {t("stopRecording")}
              </Button>
            </div>
          </div>
        )}

        {studioState === "recorded" && (
          <div className="text-center space-y-6 w-full">
            {audioUrl && (
              <div className="w-full py-4 px-6 bg-primary-tint/20 rounded-xl border border-primary/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-label text-text-muted">Audio ({recordingSeconds}s)</span>
                </div>
                <audio src={audioUrl} controls className="h-10 max-w-[240px]" />
              </div>
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
            </div>
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
