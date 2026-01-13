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
 * Target: 5-20MB per video, optimized for fast streaming
 *
 * Changes from previous version:
 * - CRF 28 (was 23): ~50% smaller files while maintaining quality
 * - High profile (was baseline): 2x better compression with modern codec features
 * - 720p (was 1080p): Better for web/mobile, ~75% of 1080p size
 * - 24fps: Reduces file size by ~20% for videos with higher source fps
 * - Level 4.0: Ensures compatibility with all modern browsers
 */
const FFMPEG_SETTINGS = {
  videoCodec: 'libx264',
  crf: '28',
  preset: 'slow',
  profile: 'high',
  level: '4.0',
  maxWidth: 1280,
  maxHeight: 720,
  fps: '24',
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
    '-level', FFMPEG_SETTINGS.level,
    '-vf', `"scale='min(${FFMPEG_SETTINGS.maxWidth},iw)':'min(${FFMPEG_SETTINGS.maxHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=${FFMPEG_SETTINGS.fps}"`,
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
