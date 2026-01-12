import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const SOURCE_DIR = path.join(process.cwd(), 'images');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'videos');
const TOTAL_VIDEOS = 30;

/**
 * FFmpeg compression settings for web delivery
 * Target: 10-30MB per video, optimized for streaming
 */
const FFMPEG_SETTINGS = {
  videoCodec: 'libx264',
  crf: '23',
  preset: 'slow',
  profile: 'baseline',
  maxWidth: 1920,
  maxHeight: 1080,
  audioCodec: 'aac',
  audioBitrate: '128k',
  movflags: '+faststart'
};

async function optimizeVideo(index: number): Promise<void> {
  const inputPath = path.join(SOURCE_DIR, `${index}.mp4`);
  const outputPath = path.join(OUTPUT_DIR, `${index}.mp4`);

  if (!fs.existsSync(inputPath)) {
    console.log(`⏭️  Skipping ${index}.mp4 (not found)`);
    return;
  }

  // Build FFmpeg command
  const cmd = [
    'ffmpeg',
    '-i', `"${inputPath}"`,
    '-c:v', FFMPEG_SETTINGS.videoCodec,
    '-crf', FFMPEG_SETTINGS.crf,
    '-preset', FFMPEG_SETTINGS.preset,
    '-profile:v', FFMPEG_SETTINGS.profile,
    '-vf', `"scale='min(${FFMPEG_SETTINGS.maxWidth},iw)':'min(${FFMPEG_SETTINGS.maxHeight},ih)':force_original_aspect_ratio=decrease"`,
    '-c:a', FFMPEG_SETTINGS.audioCodec,
    '-b:a', FFMPEG_SETTINGS.audioBitrate,
    '-movflags', FFMPEG_SETTINGS.movflags,
    '-y', // Overwrite output
    `"${outputPath}"`
  ].join(' ');

  const inputStats = fs.statSync(inputPath);
  const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);

  console.log(`🎬 Processing ${index}.mp4 (${inputSizeMB}MB)...`);

  try {
    await execAsync(cmd);

    const outputStats = fs.statSync(outputPath);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const savings = (((inputStats.size - outputStats.size) / inputStats.size) * 100).toFixed(1);

    console.log(`   ✅ ${outputSizeMB}MB (saved ${savings}%)`);
  } catch (error) {
    console.error(`   ❌ Error processing ${index}.mp4:`, error);
  }
}

async function main() {
  console.log('🎥 Starting video optimization...\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Process videos sequentially to avoid overwhelming CPU
  for (let i = 0; i < TOTAL_VIDEOS; i++) {
    await optimizeVideo(i);
  }

  console.log('\n✅ Video optimization complete!');
}

main().catch(console.error);
