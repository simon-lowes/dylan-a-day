export const TOTAL_IMAGES = 377;
export const TOTAL_VIDEOS = 30;
export const VIDEO_START_DAY = 13; // Jan 13
export const VIDEO_INTERVAL = 12.1; // Days between videos

// LCG PRNG (Park-Miller) for deterministic seeded randomness
export function lcgNext(seed: number): number {
  return (seed * 16807) % 2147483647;
}

// Generate a full permutation of [0..totalImages-1] seeded by year
// Then index by dayOfYear — guarantees no repeats within a year
export function getDailyImageIndex(totalImages: number, date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Create array [0, 1, 2, ..., totalImages-1]
  const indices = Array.from({ length: totalImages }, (_, i) => i);

  // Fisher-Yates shuffle with year-based seed
  let seed = date.getFullYear();
  for (let i = indices.length - 1; i > 0; i--) {
    seed = lcgNext(seed);
    const j = seed % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices[dayOfYear % totalImages];
}

// Get daily random boolean for direction variety
export function getDailyDirectionFlip(date: Date = new Date()): boolean {
  const seed =
    date.getFullYear() * 10000 +
    (date.getMonth() + 1) * 100 +
    date.getDate();
  return lcgNext(seed * 3) % 2 === 0;
}

// Generate array of all video days for a given year
export function getVideoDays(year: number): number[] {
  const videoDays: number[] = [];
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 366 : 365;

  let currentDay = VIDEO_START_DAY;
  while (currentDay <= daysInYear) {
    videoDays.push(Math.round(currentDay));
    currentDay += VIDEO_INTERVAL;
  }

  return videoDays;
}

// Check if a given day-of-year should display a video
export function isVideoDay(dayOfYear: number, year: number): boolean {
  const videoDays = getVideoDays(year);
  return videoDays.includes(dayOfYear);
}

// Get which video (0-29) to display on a video day
export function getVideoIndex(date: Date): number {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Find the ordinal position of this day within the year's video days.
  // Index that ordinal into a year-seeded permutation of [0..TOTAL_VIDEOS-1]
  // so each video day maps to a distinct video (mirrors getDailyImageIndex),
  // surfacing the whole catalog instead of random-with-replacement collisions.
  const videoDays = getVideoDays(year);
  const ordinal = videoDays.indexOf(dayOfYear);

  // Fall back to ordinal 0 if the date is not a recognized video day.
  const dayOrdinal = ordinal >= 0 ? ordinal : 0;

  // Fisher-Yates shuffle with year-based seed
  const indices = Array.from({ length: TOTAL_VIDEOS }, (_, i) => i);
  let seed = year;
  for (let i = indices.length - 1; i > 0; i--) {
    seed = lcgNext(seed);
    const j = seed % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices[dayOrdinal % TOTAL_VIDEOS];
}

// Determine optimal Ken Burns animation based on image and viewport aspect ratios
export function getSmartKenBurnsClass(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  flipDirection: boolean
): string {
  const imageAspect = imageWidth / imageHeight;
  const viewportAspect = viewportWidth / viewportHeight;

  // Calculate how much the image is cropped in each dimension
  const aspectDiff = imageAspect / viewportAspect;

  if (aspectDiff > 1.15) {
    // Image is significantly wider than viewport - pan horizontally
    return flipDirection ? "kenburns-pan-left" : "kenburns-pan-right";
  } else if (aspectDiff < 0.85) {
    // Image is significantly taller than viewport - pan vertically
    return flipDirection ? "kenburns-pan-up" : "kenburns-pan-down";
  } else {
    // Aspect ratios are similar - gentle zoom
    return flipDirection ? "kenburns-zoom-in" : "kenburns-zoom-out";
  }
}
