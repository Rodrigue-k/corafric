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
    <div className={`w-full max-w-xl mx-auto flex items-center gap-3 sm:gap-4 py-2 ${className}`}>
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

      {/* Perfectly Centered Circular Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
        aria-label={isPlaying ? "Mettre en pause" : "Écouter l'enregistrement"}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      {/* Current Time (Left of scrubber) */}
      <span className="text-xs font-mono text-foreground font-semibold tabular-nums shrink-0 min-w-[28px]">
        {formatTime(currentTime)}
      </span>

      {/* Continuous Scrubber Track (Perfect vertical center with play button) */}
      <div
        ref={progressBarRef}
        onClick={handleSeek}
        className="group relative flex-1 h-6 flex items-center cursor-pointer select-none"
        title="Naviguer dans l'audio"
      >
        {/* Track Line */}
        <div className="h-1.5 w-full bg-[#EADCC9] rounded-full overflow-hidden relative">
          <div
            className="h-full bg-primary rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Scrubber Knob */}
        <div
          className="absolute w-3 h-3 bg-foreground rounded-full shadow-2xs pointer-events-none transition-all duration-75 -translate-x-1/2 group-hover:scale-125"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Duration (Right of scrubber) */}
      <span className="text-xs font-mono text-text-muted tabular-nums shrink-0 min-w-[28px]">
        {formatTime(duration)}
      </span>

      {/* Replay Button */}
      <button
        type="button"
        onClick={handleRestart}
        className="p-2 text-text-muted hover:text-primary hover:bg-black/5 rounded-full transition-colors cursor-pointer shrink-0"
        title="Réécouter depuis le début"
        aria-label="Réécouter"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};
