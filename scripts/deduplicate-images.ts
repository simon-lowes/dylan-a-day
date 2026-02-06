import { createHash } from "crypto";
import { readFileSync, readdirSync, renameSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(process.cwd(), "public", "images");
const SOURCE_DIR = join(process.cwd(), "images");

function md5(filePath: string): string {
  const data = readFileSync(filePath);
  return createHash("md5").update(data).digest("hex");
}

function getJpgFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".jpg"))
    .sort((a, b) => {
      const numA = parseInt(a.replace(".jpg", ""), 10);
      const numB = parseInt(b.replace(".jpg", ""), 10);
      return numA - numB;
    });
}

// Step 1: Hash all files in public/images and find duplicates
console.log("Scanning public/images for duplicates...\n");

const publicFiles = getJpgFiles(PUBLIC_DIR);
const hashMap = new Map<string, number[]>(); // hash -> list of image numbers

for (const file of publicFiles) {
  const num = parseInt(file.replace(".jpg", ""), 10);
  const hash = md5(join(PUBLIC_DIR, file));
  const existing = hashMap.get(hash) || [];
  existing.push(num);
  hashMap.set(hash, existing);
}

// Identify duplicates (groups with more than one file)
const duplicateGroups = [...hashMap.values()].filter((g) => g.length > 1);
const toRemove = new Set<number>();

for (const group of duplicateGroups) {
  // Keep the lowest-numbered file, remove the rest
  const sorted = [...group].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    toRemove.add(sorted[i]);
  }
}

console.log(`Found ${duplicateGroups.length} duplicate groups`);
console.log(`Removing ${toRemove.size} duplicate files\n`);

if (toRemove.size === 0) {
  console.log("No duplicates found. Exiting.");
  process.exit(0);
}

// Step 2: Delete duplicates from both directories
try {
  for (const num of [...toRemove].sort((a, b) => a - b)) {
    const pubFile = join(PUBLIC_DIR, `${num}.jpg`);
    const srcFile = join(SOURCE_DIR, `${num}.jpg`);

    if (existsSync(pubFile)) {
      unlinkSync(pubFile);
      console.log(`  Deleted public/images/${num}.jpg`);
    }
    if (existsSync(srcFile)) {
      unlinkSync(srcFile);
      console.log(`  Deleted images/${num}.jpg`);
    }
  }
} catch (error) {
  console.error("Failed during duplicate deletion:", error);
  process.exit(1);
}

// Step 3: Renumber remaining files sequentially in both directories
console.log("\nRenumbering remaining files...");

for (const dir of [PUBLIC_DIR, SOURCE_DIR]) {
  if (!existsSync(dir)) continue;

  const remaining = getJpgFiles(dir);
  const dirLabel = dir === PUBLIC_DIR ? "public/images" : "images";

  // First pass: rename to temp names to avoid collisions
  try {
    for (let i = 0; i < remaining.length; i++) {
      renameSync(join(dir, remaining[i]), join(dir, `__temp_${i}.jpg`));
    }
  } catch (error) {
    console.error(`Failed renaming to temp names in ${dirLabel} at file index:`, error);
    process.exit(1);
  }

  // Validate first pass: ensure all temp files exist
  const actualTempFiles = readdirSync(dir).filter((f) => f.startsWith("__temp_") && f.endsWith(".jpg"));
  if (actualTempFiles.length !== remaining.length) {
    console.error(`Validation failed in ${dirLabel}: expected ${remaining.length} temp files, found ${actualTempFiles.length}`);
    process.exit(1);
  }

  // Second pass: rename to final sequential numbers
  try {
    for (let i = 0; i < remaining.length; i++) {
      renameSync(join(dir, `__temp_${i}.jpg`), join(dir, `${i}.jpg`));
    }
  } catch (error) {
    console.error(`Failed renaming to final names in ${dirLabel}:`, error);
    process.exit(1);
  }

  // Validate second pass: ensure expected file count
  const finalFiles = getJpgFiles(dir);
  if (finalFiles.length !== remaining.length) {
    console.error(`Validation failed in ${dirLabel}: expected ${remaining.length} files, found ${finalFiles.length}`);
    process.exit(1);
  }

  console.log(`  ${dirLabel}: renumbered ${remaining.length} files (0-${remaining.length - 1})`);
}

const finalCount = getJpgFiles(PUBLIC_DIR).length;
console.log(`\nDone! ${finalCount} unique images remain.`);
console.log(`Update TOTAL_IMAGES in src/app/page.tsx to ${finalCount}`);
