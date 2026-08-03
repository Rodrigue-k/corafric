import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
};

export const cleanAudioBlob = async (audioBlob: Blob): Promise<Blob> => {
  const ffmpegInstance = await loadFFmpeg();

  const inputName = "input.webm";
  const outputName = "output.webm";

  // Write file to FFmpeg's virtual file system
  await ffmpegInstance.writeFile(inputName, await fetchFile(audioBlob));

  // Run FFmpeg command:
  // - silenceremove: removes leading and trailing silence smoothly without clipping.
  // - afftdn: Audio FFT DeNoise for background noise reduction.
  // - loudnorm: EBU R128 loudness normalization (target I=-16 LUFS) to ensure exact uniform volume across all devices & distances.
  await ffmpegInstance.exec([
    "-i",
    inputName,
    "-af",
    "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-50dB:stop_periods=-1:stop_duration=0.3:stop_threshold=-50dB,afftdn=nf=-25,loudnorm=I=-16:LRA=11:TP=-1.5",
    outputName,
  ]);

  // Read the processed file
  const data = await ffmpegInstance.readFile(outputName);
  
  // Clean up virtual files
  await ffmpegInstance.deleteFile(inputName);
  await ffmpegInstance.deleteFile(outputName);

  const buffer = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return new Blob([buffer as unknown as BlobPart], { type: "audio/webm" });
};
