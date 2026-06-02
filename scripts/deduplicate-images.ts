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

// Step 3: Renumber remaining files sequentially in both directories.
//
// public/images/N.jpg and images/N.jpg must stay in correspondence (same N =>
// same photo at different resolutions). Renumbering each directory independently
// by re-sorting its own current contents silently breaks this whenever the two
// directories hold different number sets. Instead, derive ONE canonical mapping
// from the surviving PUBLIC_DIR numbers and apply that SAME old-number ->
// new-number mapping to both directories, keyed by original number.
console.log("\nRenumbering remaining files...");

// Helper: extract sorted surviving image numbers from a directory.
function getJpgNumbers(dir: string): number[] {
  return getJpgFiles(dir).map((f) => parseInt(f.replace(".jpg", ""), 10));
}

const publicNumbers = getJpgNumbers(PUBLIC_DIR);

// Cross-directory invariant: the surviving number set must be identical in both
// directories, otherwise the same final index would be assigned to
// non-corresponding source/public files (silent data corruption). Abort if not.
if (existsSync(SOURCE_DIR)) {
  const sourceNumbers = getJpgNumbers(SOURCE_DIR);
  const publicSet = new Set(publicNumbers);
  const sourceSet = new Set(sourceNumbers);

  const onlyInPublic = publicNumbers.filter((n) => !sourceSet.has(n));
  const onlyInSource = sourceNumbers.filter((n) => !publicSet.has(n));

  if (onlyInPublic.length > 0 || onlyInSource.length > 0) {
    console.error(
      "Aborting renumber: public/images and images do not hold the same set of image numbers."
    );
    if (onlyInPublic.length > 0) {
      console.error(`  Only in public/images: ${onlyInPublic.sort((a, b) => a - b).join(", ")}`);
    }
    if (onlyInSource.length > 0) {
      console.error(`  Only in images: ${onlyInSource.sort((a, b) => a - b).join(", ")}`);
    }
    console.error(
      "  Renumbering would break the public<->source correspondence. Reconcile the directories first."
    );
    process.exit(1);
  }
}

// Canonical mapping: original number (sorted ascending) -> final sequential index.
const oldToNew = new Map<number, number>();
publicNumbers.forEach((oldNum, newIndex) => oldToNew.set(oldNum, newIndex));

for (const dir of [PUBLIC_DIR, SOURCE_DIR]) {
  if (!existsSync(dir)) continue;

  const dirLabel = dir === PUBLIC_DIR ? "public/images" : "images";
  // Apply the SAME mapping to this directory, keyed by each file's original
  // number (not by re-sorting this directory's contents independently).
  const numbers = [...oldToNew.keys()].sort((a, b) => a - b);

  // First pass: rename each original number to a temp name keyed by its FINAL
  // index, so both directories converge on identical final numbering.
  try {
    for (const oldNum of numbers) {
      const newIndex = oldToNew.get(oldNum)!;
      renameSync(join(dir, `${oldNum}.jpg`), join(dir, `__temp_${newIndex}.jpg`));
    }
  } catch (error) {
    console.error(`Failed renaming to temp names in ${dirLabel}:`, error);
    process.exit(1);
  }

  // Validate first pass: ensure all temp files exist
  const actualTempFiles = readdirSync(dir).filter((f) => f.startsWith("__temp_") && f.endsWith(".jpg"));
  if (actualTempFiles.length !== numbers.length) {
    console.error(`Validation failed in ${dirLabel}: expected ${numbers.length} temp files, found ${actualTempFiles.length}`);
    process.exit(1);
  }

  // Second pass: rename to final sequential numbers
  try {
    for (let i = 0; i < numbers.length; i++) {
      renameSync(join(dir, `__temp_${i}.jpg`), join(dir, `${i}.jpg`));
    }
  } catch (error) {
    console.error(`Failed renaming to final names in ${dirLabel}:`, error);
    process.exit(1);
  }

  // Validate second pass: ensure expected file count
  const finalFiles = getJpgFiles(dir);
  if (finalFiles.length !== numbers.length) {
    console.error(`Validation failed in ${dirLabel}: expected ${numbers.length} files, found ${finalFiles.length}`);
    process.exit(1);
  }

  console.log(`  ${dirLabel}: renumbered ${numbers.length} files (0-${numbers.length - 1})`);
}

const finalCount = getJpgFiles(PUBLIC_DIR).length;
console.log(`\nDone! ${finalCount} unique images remain.`);
console.log(`Update TOTAL_IMAGES in src/app/daily-media.ts to ${finalCount}`);
