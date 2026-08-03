"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface CustomAudioPlayerProps {
  src: string;
  durationInSeconds?: number;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({
  src,
  durationInSeconds = 0,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationInSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset player state when src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(durationInSeconds);

    if (audioRef.current && src) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [src, durationInSeconds]);

  if (!src) return null;

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err: unknown) {
      // Gracefully handle NotSupportedError or Autoplay/Abort errors
      console.warn("Audio playback issue:", err instanceof Error ? err.message : err);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time) || time < 0) return "0:00.0";
    const mins = Math.floor(time / 60);
    const secs = (time % 60).toFixed(1);
    const secsFormatted = parseFloat(secs) < 10 ? `0${secs}` : secs;
    return `${mins}:${secsFormatted}`;
  };

  return (
    <div className="w-full max-w-md mx-auto py-3 px-4 bg-secondary/10 border border-border rounded-xl flex items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={(e) => {
          console.warn("Audio element error:", e);
          setIsPlaying(false);
        }}
        onLoadedMetadata={(e) => {
          if (isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
            setDuration(e.currentTarget.duration);
          }
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 1}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[11px] font-mono text-text-muted">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
