import { describe, it, expect } from "vitest";
import { isValidAudioBuffer } from "@/lib/audioValidation";

describe("audioValidation - Magic Bytes Validation", () => {
  it("recognizes valid WebM / Matroska audio headers", () => {
    // 0x1A 0x45 0xDF 0xA3
    const webmBuffer = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01]);
    expect(isValidAudioBuffer(webmBuffer)).toBe(true);
  });

  it("recognizes valid OGG audio headers", () => {
    // 'OggS' = 0x4F 0x67 0x67 0x53
    const oggBuffer = Buffer.from([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(isValidAudioBuffer(oggBuffer)).toBe(true);
  });

  it("recognizes valid WAV audio headers (RIFF...WAVE)", () => {
    // RIFF .... WAVE
    const wavBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // Size
      0x57, 0x41, 0x56, 0x45, // WAVE
      0x66, 0x6d, 0x74, 0x20, // fmt 
    ]);
    expect(isValidAudioBuffer(wavBuffer)).toBe(true);
  });

  it("recognizes valid MP4 / M4A headers (ftyp box)", () => {
    const mp4Buffer = Buffer.from([
      0x00, 0x00, 0x00, 0x20, // Box length
      0x66, 0x74, 0x79, 0x70, // 'ftyp'
      0x4d, 0x34, 0x41, 0x20, // 'M4A '
    ]);
    expect(isValidAudioBuffer(mp4Buffer)).toBe(true);
  });

  it("recognizes valid MP3 headers (ID3 tag)", () => {
    // ID3
    const mp3Buffer = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(isValidAudioBuffer(mp3Buffer)).toBe(true);
  });

  it("strictly rejects plain text / HTML masquerading as audio", () => {
    const fakeWebm = Buffer.from("<html><script>alert('xss')</script></html>");
    expect(isValidAudioBuffer(fakeWebm)).toBe(false);

    const fakeTxt = Buffer.from("Hello world this is not an audio recording");
    expect(isValidAudioBuffer(fakeTxt)).toBe(false);
  });

  it("rejects empty or truncated buffers (< 12 bytes)", () => {
    expect(isValidAudioBuffer(Buffer.from([]))).toBe(false);
    expect(isValidAudioBuffer(Buffer.from([0x1a, 0x45]))).toBe(false);
  });
});
