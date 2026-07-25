/**
 * Concatenative Audio Engine (Web Audio API)
 * Supports both Fluid Word Reading (Phoneme Blending) and Letter-by-Letter Spelling.
 */

export interface PlayOptions {
  mode?: "read" | "spell";
  pauseMs?: number;
  onCharacter?: (char: string, index: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

export class ConcatenativePlayer {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isCancelled: boolean = false;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === "suspended") {
      void this.audioContext.resume();
    }
    return this.audioContext;
  }

  public async playSequence(text: string, options: PlayOptions = {}): Promise<void> {
    this.stop();
    this.isCancelled = false;

    const { mode = "read", pauseMs = 120, onCharacter, onEnded, onError } = options;

    const characters = text
      .toLowerCase()
      .split("")
      .filter((char) => /[a-zɖɛƒɣŋɔʋ]/.test(char));

    if (characters.length === 0) {
      if (onEnded) onEnded();
      return;
    }

    if (mode === "read") {
      await this.playFluidWord(characters, onCharacter, onEnded, onError);
    } else {
      await this.playSpelledWord(characters, pauseMs, onCharacter, onEnded, onError);
    }
  }

  /**
   * FLUID WORD READING MODE:
   * Decodes all character audio buffers, trims lead/tail silence, stitches them into a single fluid audio buffer with micro-crossfade.
   */
  private async playFluidWord(
    characters: string[],
    onCharacter?: (char: string, index: number) => void,
    onEnded?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const ctx = this.getAudioContext();

      // Load and decode all character buffers in parallel
      const bufferPromises = characters.map(async (char) => {
        const url = `${window.location.origin}/audios/${char}.mp4?v=1`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`Audio for ${char} not found, skipping.`);
            return null;
          }
          const arrayBuffer = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          return { char, buffer: this.trimSilence(decoded) };
        } catch (e) {
          console.warn(`Error fetching audio for ${char}, skipping.`, e);
          return null;
        }
      });

      const rawItems = await Promise.all(bufferPromises);
      const items = rawItems.filter((item): item is { char: string; buffer: AudioBuffer } => item !== null);
      
      if (this.isCancelled) return;
      if (items.length === 0) return;

      // Calculate total sample length with 15ms crossfade overlap
      const sampleRate = ctx.sampleRate;
      const overlapSamples = Math.floor(sampleRate * 0.015); // 15ms overlap

      let totalSamples = 0;
      items.forEach(({ buffer }) => {
        totalSamples += buffer.length - overlapSamples;
      });
      totalSamples += overlapSamples;

      if (totalSamples <= 0) return;

      const numChannels = items[0].buffer.numberOfChannels;
      const stitchedBuffer = ctx.createBuffer(numChannels, totalSamples, sampleRate);

      let currentOffset = 0;

      items.forEach(({ buffer }) => {
        for (let channel = 0; channel < numChannels; channel++) {
          const outputData = stitchedBuffer.getChannelData(channel);
          const inputData = buffer.getChannelData(channel);

          for (let i = 0; i < buffer.length; i++) {
            const outIndex = currentOffset + i;
            if (outIndex < totalSamples) {
              // Apply equal power fade-in/fade-out at overlap boundaries for smooth blending
              outputData[outIndex] += inputData[i];
            }
          }
        }
        currentOffset += buffer.length - overlapSamples;
      });

      // Play the stitched fluid buffer
      const source = ctx.createBufferSource();
      source.buffer = stitchedBuffer;
      source.connect(ctx.destination);
      this.currentSource = source;

      // Highlight active characters based on timing
      let charOffsetSec = 0;
      items.forEach(({ char, buffer }, idx) => {
        const duration = (buffer.length - overlapSamples) / sampleRate;
        const targetTime = charOffsetSec;
        setTimeout(() => {
          if (!this.isCancelled && onCharacter) {
            onCharacter(char, idx);
          }
        }, targetTime * 1000);
        charOffsetSec += duration;
      });

      source.onended = () => {
        this.currentSource = null;
        if (!this.isCancelled && onEnded) onEnded();
      };

      source.start();
    } catch (err) {
      console.error("Fluid concatenative synthesis error:", err);
      if (onError) onError(err instanceof Error ? err : new Error("Failed fluid synthesis"));
      if (onEnded) onEnded();
    }
  }

  /**
   * Trims leading and trailing silence from an AudioBuffer for tight blending.
   */
  private trimSilence(buffer: AudioBuffer, threshold = 0.01): AudioBuffer {
    const channelData = buffer.getChannelData(0);
    let start = 0;
    let end = channelData.length - 1;

    while (start < channelData.length && Math.abs(channelData[start]) < threshold) {
      start++;
    }
    while (end > start && Math.abs(channelData[end]) < threshold) {
      end--;
    }

    // Keep at least a minimal frame
    if (end <= start) return buffer;

    const trimmedLength = end - start + 1;
    const ctx = this.getAudioContext();
    const trimmedBuffer = ctx.createBuffer(buffer.numberOfChannels, trimmedLength, buffer.sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const src = buffer.getChannelData(channel);
      const dest = trimmedBuffer.getChannelData(channel);
      for (let i = 0; i < trimmedLength; i++) {
        dest[i] = src[start + i];
      }
    }

    return trimmedBuffer;
  }

  /**
   * LETTER-BY-LETTER SPELLING MODE
   */
  private async playSpelledWord(
    characters: string[],
    pauseMs: number,
    onCharacter?: (char: string, index: number) => void,
    onEnded?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    for (let i = 0; i < characters.length; i++) {
      if (this.isCancelled) break;
      const char = characters[i];
      if (onCharacter) onCharacter(char, i);

      try {
        await new Promise<void>((resolve, reject) => {
          const audioUrl = `${window.location.origin}/audios/${char}.mp4?v=1`;
          const audio = new Audio(audioUrl);
          this.currentAudioElement = audio;

          audio.onended = () => {
            this.currentAudioElement = null;
            resolve();
          };
          audio.onerror = (e) => {
            this.currentAudioElement = null;
            reject(audio.error?.message || e);
          };
          audio.play().catch(reject);
        });

        if (this.isCancelled) break;
        if (i < characters.length - 1 && pauseMs > 0) {
          await new Promise((res) => setTimeout(res, pauseMs));
        }
      } catch (err) {
        console.warn(`Spelling audio error for ${char}`, err);
        if (onError) onError(err instanceof Error ? err : new Error(`Failed ${char}`));
      }
    }

    if (!this.isCancelled && onEnded) {
      onEnded();
    }
  }

  public stop(): void {
    this.isCancelled = true;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
  }
}
