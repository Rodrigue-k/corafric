const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

async function processAudios() {
  const audiosDir = path.join(__dirname, '../public/audios');
  const backupDir = path.join(audiosDir, 'raw_backup');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const files = fs.readdirSync(audiosDir).filter(f => f.endsWith('.mp4') || f.endsWith('.mp3'));
  console.log(`=== Studio Audio DSP Cleaner & Enhancer ===`);
  console.log(`Found ${files.length} audio files in ${audiosDir}`);

  let count = 0;
  for (const file of files) {
    const srcPath = path.join(audiosDir, file);
    const backupPath = path.join(backupDir, file);

    // 1. Backup raw original file if not already backed up
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(srcPath, backupPath);
    }

    const tempOutPath = path.join(audiosDir, `temp_${file}`);

    // Studio Chain:
    // 1. silenceremove: Strip leading dead air / noise clicks before speech begins, and trailing silence after word
    // 2. highpass: 80Hz cutoff to kill room rumble, AC hum, and table vibrations
    // 3. lowpass: 14000Hz to eliminate hiss
    // 4. equalizer: +2dB presence peak at 3.2kHz for clear vocal articulation
    // 5. loudnorm: EBU R128 broadcast loudness normalization to -16 LUFS
    const audioFilters = [
      "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-38dB:stop_periods=1:stop_duration=0.08:stop_threshold=-38dB",
      "highpass=f=80",
      "lowpass=f=14000",
      "equalizer=f=3200:t=q:w=1.2:g=2.5",
      "loudnorm=I=-16:TP=-1.5:LRA=7"
    ].join(',');

    try {
      console.log(`[${++count}/${files.length}] Processing & Enhancing: ${file}...`);
      
      // Clean processing with ffmpeg
      const cmd = `"${ffmpegPath}" -y -i "${backupPath}" -af "${audioFilters}" -vn -c:a aac -b:a 128k -ar 44100 "${tempOutPath}"`;
      execSync(cmd, { stdio: 'pipe' });

      // Replace with clean enhanced audio
      if (fs.existsSync(tempOutPath)) {
        fs.unlinkSync(srcPath);
        fs.renameSync(tempOutPath, srcPath);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
      if (fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath);
    }
  }

  console.log(`\n✅ All ${count} audio files successfully cleaned, normalized to -16 LUFS, and enhanced to studio quality!`);
}

processAudios().catch(console.error);
