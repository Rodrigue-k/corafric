"use client";

import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isRecording || !stream) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderFrame = () => {
        if (!canvasRef.current || !ctx) return;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);

        // Customize drawing style similar to the logo bars
        const barCount = 12;
        const barWidth = 6;
        const gap = 8;
        const startX = (width - (barCount * barWidth + (barCount - 1) * gap)) / 2;

        for (let i = 0; i < barCount; i++) {
          // Map indices to frequency array
          const freqIndex = Math.floor((i / barCount) * bufferLength);
          const value = dataArray[freqIndex];
          // Scale height from frequency value
          const percent = value / 255;
          const barHeight = Math.max(4, percent * height * 0.85);

          const x = startX + i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          // Drawing capsule shape (rounded rectangle)
          ctx.fillStyle = i % 2 === 0 ? "#B84A2A" : "#D4A017";
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 3);
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch (err) {
      console.error("Failed to setup real-time visualizer:", err);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream, isRecording]);

  // If not recording, show a static or simple pulsing wave placeholder
  return (
    <div className="w-full flex flex-col items-center justify-center py-4 bg-black/5 rounded-xl border border-dashed border-border">
      {isRecording ? (
        <canvas ref={canvasRef} width={300} height={80} className="w-full max-w-[300px] h-[80px]" />
      ) : (
        <div className="flex gap-2 h-10 items-center justify-center">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`w-[6px] rounded-full ${
                i % 2 === 0 ? "bg-primary/30" : "bg-accent/30"
              }`}
              style={{
                height: `${12 + (i % 3) * 6}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
