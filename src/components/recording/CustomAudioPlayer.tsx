"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface CustomAudioPlayerProps {
  src: string;
  className?: string;
  durationInSeconds?: number;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({
  src,
  className = "",
  durationInSeconds,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(durationInSeconds || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset state when audio source changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(durationInSeconds || 0);
  }, [src, durationInSeconds]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = clickPos / rect.width;
    const newTime = percentage * (duration || 1);

    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    void audioRef.current.play().then(() => setIsPlaying(true));
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!src) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`w-full max-w-lg mx-auto bg-[#FAF8F5] border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          if (isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
            setDuration(e.currentTarget.duration);
          }
        }}
      />

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-sm"
          aria-label={isPlaying ? "Mettre en pause" : "Écouter l'enregistrement"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Timeline & Progress Bar */}
        <div className="flex-1 flex flex-col justify-center space-y-2 min-w-0">
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="group relative h-4 w-full flex items-center cursor-pointer select-none"
            title="Naviguer dans l'audio"
          >
            {/* Background Track */}
            <div className="h-2 w-full bg-[#EADCC9]/60 rounded-full overflow-hidden relative">
              {/* Active Fill */}
              <div
                className="h-full bg-primary rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Playhead Thumb */}
            <div
              className="absolute w-3.5 h-3.5 bg-foreground rounded-full shadow-sm pointer-events-none transition-all duration-75 -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between items-center text-xs font-mono text-text-muted">
            <span className="font-semibold text-foreground">{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Replay Button */}
        <button
          type="button"
          onClick={handleRestart}
          className="p-2.5 text-text-muted hover:text-primary hover:bg-black/5 rounded-full transition-colors cursor-pointer shrink-0"
          title="Réécouter depuis le début"
          aria-label="Réécouter"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
