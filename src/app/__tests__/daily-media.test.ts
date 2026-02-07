import { describe, it, expect } from 'vitest';
import {
  lcgNext,
  getDailyImageIndex,
  getDailyDirectionFlip,
  getSmartKenBurnsClass,
  getVideoDays,
  isVideoDay,
  getVideoIndex,
  TOTAL_IMAGES,
  TOTAL_VIDEOS,
  VIDEO_START_DAY,
  VIDEO_INTERVAL,
} from '../daily-media';

describe('lcgNext (Park-Miller LCG)', () => {
  it('returns a positive integer', () => {
    const result = lcgNext(1);
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('is deterministic — same seed produces same output', () => {
    expect(lcgNext(12345)).toBe(lcgNext(12345));
  });

  it('produces different outputs for different seeds', () => {
    expect(lcgNext(1)).not.toBe(lcgNext(2));
  });

  it('stays within the LCG modulus range', () => {
    const modulus = 2147483647;
    for (const seed of [1, 100, 999999, 2147483646]) {
      const result = lcgNext(seed);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(modulus);
    }
  });
});

describe('getDailyImageIndex', () => {
  it('returns the same index for the same date', () => {
    const date = new Date(2026, 0, 15); // Jan 15, 2026
    const idx1 = getDailyImageIndex(TOTAL_IMAGES, date);
    const idx2 = getDailyImageIndex(TOTAL_IMAGES, date);
    expect(idx1).toBe(idx2);
  });

  it('returns different indices for different dates', () => {
    const date1 = new Date(2026, 0, 15);
    const date2 = new Date(2026, 0, 16);
    const idx1 = getDailyImageIndex(TOTAL_IMAGES, date1);
    const idx2 = getDailyImageIndex(TOTAL_IMAGES, date2);
    expect(idx1).not.toBe(idx2);
  });

  it('returns index within valid range [0, totalImages)', () => {
    for (let month = 0; month < 12; month++) {
      const date = new Date(2026, month, 10);
      const idx = getDailyImageIndex(TOTAL_IMAGES, date);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(TOTAL_IMAGES);
    }
  });

  it('works with different totalImages values', () => {
    const date = new Date(2026, 5, 1);
    const idx10 = getDailyImageIndex(10, date);
    expect(idx10).toBeGreaterThanOrEqual(0);
    expect(idx10).toBeLessThan(10);

    const idx1000 = getDailyImageIndex(1000, date);
    expect(idx1000).toBeGreaterThanOrEqual(0);
    expect(idx1000).toBeLessThan(1000);
  });

  it('produces no repeats within a year (Fisher-Yates guarantee)', () => {
    // The shuffle produces a permutation seeded by year, indexed by dayOfYear.
    // DST transitions can cause two calendar days to share a dayOfYear value,
    // but distinct dayOfYear values always map to distinct image indices.
    const year = 2026;
    const dayOfYearToIndex = new Map<number, number>();

    for (let d = 1; d <= 365; d++) {
      const date = new Date(year, 0, d);
      const idx = getDailyImageIndex(TOTAL_IMAGES, date);
      const startOfYear = new Date(year, 0, 0);
      const diff = date.getTime() - startOfYear.getTime();
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
      dayOfYearToIndex.set(dayOfYear, idx);
    }

    // Each unique dayOfYear should map to a unique image index
    const uniqueIndices = new Set(dayOfYearToIndex.values());
    expect(uniqueIndices.size).toBe(dayOfYearToIndex.size);
  });

  it('wraps correctly when dayOfYear exceeds totalImages', () => {
    // Use a small totalImages to force wrapping
    const smallTotal = 10;
    const indices: number[] = [];
    for (let d = 1; d <= 20; d++) {
      const date = new Date(2026, 0, d);
      const idx = getDailyImageIndex(smallTotal, date);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(smallTotal);
      indices.push(idx);
    }
    // First 10 should all be unique (full permutation)
    expect(new Set(indices.slice(0, 10)).size).toBe(10);
  });

  it('changes permutation across years', () => {
    const date2026 = new Date(2026, 3, 15);
    const date2027 = new Date(2027, 3, 15);
    const idx2026 = getDailyImageIndex(TOTAL_IMAGES, date2026);
    const idx2027 = getDailyImageIndex(TOTAL_IMAGES, date2027);
    // Different years should (almost certainly) produce different indices for the same date
    // The permutation is seeded by year, so this is guaranteed unless there's a collision
    expect(idx2026).not.toBe(idx2027);
  });

  it('handles New Year boundary correctly', () => {
    const dec31 = new Date(2026, 11, 31);
    const jan1 = new Date(2027, 0, 1);
    const idxDec31 = getDailyImageIndex(TOTAL_IMAGES, dec31);
    const idxJan1 = getDailyImageIndex(TOTAL_IMAGES, jan1);
    // Different years, different permutations
    expect(idxDec31).toBeGreaterThanOrEqual(0);
    expect(idxJan1).toBeGreaterThanOrEqual(0);
    expect(idxDec31).toBeLessThan(TOTAL_IMAGES);
    expect(idxJan1).toBeLessThan(TOTAL_IMAGES);
  });

  it('handles leap year (366 days)', () => {
    // 2028 is a leap year
    const feb29 = new Date(2028, 1, 29);
    const idx = getDailyImageIndex(TOTAL_IMAGES, feb29);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(TOTAL_IMAGES);

    // Check day 366
    const dec31 = new Date(2028, 11, 31);
    const idxLast = getDailyImageIndex(TOTAL_IMAGES, dec31);
    expect(idxLast).toBeGreaterThanOrEqual(0);
    expect(idxLast).toBeLessThan(TOTAL_IMAGES);
  });
});

describe('getDailyDirectionFlip', () => {
  it('returns a boolean', () => {
    const result = getDailyDirectionFlip(new Date(2026, 0, 15));
    expect(typeof result).toBe('boolean');
  });

  it('is deterministic — same date produces same result', () => {
    const date = new Date(2026, 5, 20);
    expect(getDailyDirectionFlip(date)).toBe(getDailyDirectionFlip(date));
  });

  it('produces both true and false values across different dates', () => {
    const results = new Set<boolean>();
    for (let d = 1; d <= 30; d++) {
      results.add(getDailyDirectionFlip(new Date(2026, 0, d)));
    }
    expect(results.size).toBe(2);
  });

  it('different dates can produce different results', () => {
    // Check enough dates to find at least one flip
    const values: boolean[] = [];
    for (let d = 1; d <= 10; d++) {
      values.push(getDailyDirectionFlip(new Date(2026, 0, d)));
    }
    // Not all values should be the same
    expect(new Set(values).size).toBeGreaterThan(1);
  });
});

describe('getSmartKenBurnsClass', () => {
  const validClasses = [
    'kenburns-pan-left',
    'kenburns-pan-right',
    'kenburns-pan-up',
    'kenburns-pan-down',
    'kenburns-zoom-in',
    'kenburns-zoom-out',
  ];

  it('returns a valid CSS class name', () => {
    const cls = getSmartKenBurnsClass(1920, 1080, 1920, 1080, false);
    expect(validClasses).toContain(cls);
  });

  it('pans horizontally for wide images on narrow viewport', () => {
    // Image 4:3 (1.33), viewport 9:16 (0.5625), ratio = 2.37 > 1.15
    expect(getSmartKenBurnsClass(1600, 1200, 1080, 1920, false)).toBe('kenburns-pan-right');
    expect(getSmartKenBurnsClass(1600, 1200, 1080, 1920, true)).toBe('kenburns-pan-left');
  });

  it('pans vertically for tall images on wide viewport', () => {
    // Image 9:16 (0.5625), viewport 16:9 (1.78), ratio = 0.316 < 0.85
    expect(getSmartKenBurnsClass(1080, 1920, 1920, 1080, false)).toBe('kenburns-pan-down');
    expect(getSmartKenBurnsClass(1080, 1920, 1920, 1080, true)).toBe('kenburns-pan-up');
  });

  it('zooms for similar aspect ratios', () => {
    // Image 16:9 (1.78), viewport 16:9 (1.78), ratio = 1.0
    expect(getSmartKenBurnsClass(1920, 1080, 1920, 1080, false)).toBe('kenburns-zoom-out');
    expect(getSmartKenBurnsClass(1920, 1080, 1920, 1080, true)).toBe('kenburns-zoom-in');
  });

  it('respects flipDirection parameter', () => {
    // Same dimensions, different flip values should give opposite directions
    const cls1 = getSmartKenBurnsClass(1920, 1080, 1920, 1080, false);
    const cls2 = getSmartKenBurnsClass(1920, 1080, 1920, 1080, true);
    expect(cls1).not.toBe(cls2);
  });

  it('handles edge cases at aspect ratio thresholds', () => {
    // aspectDiff exactly at 1.15 boundary (just above)
    // Image: 1150w x 1000h (1.15), viewport: 1000w x 1000h (1.0), ratio = 1.15
    // Since > 1.15 is strict, 1.15 should not trigger horizontal pan
    const atBoundary = getSmartKenBurnsClass(1150, 1000, 1000, 1000, false);
    expect(atBoundary).toBe('kenburns-zoom-out'); // Not pan, because 1.15 is not > 1.15

    // Just above threshold
    const aboveBoundary = getSmartKenBurnsClass(1160, 1000, 1000, 1000, false);
    expect(aboveBoundary).toBe('kenburns-pan-right'); // 1.16 > 1.15
  });

  it('handles square images and square viewports', () => {
    const cls = getSmartKenBurnsClass(500, 500, 500, 500, false);
    expect(cls).toBe('kenburns-zoom-out');
  });
});

describe('getVideoDays', () => {
  it('returns an array of day numbers', () => {
    const days = getVideoDays(2026);
    expect(Array.isArray(days)).toBe(true);
    expect(days.length).toBeGreaterThan(0);
    days.forEach((d) => {
      expect(Number.isInteger(d)).toBe(true);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(365);
    });
  });

  it('starts with VIDEO_START_DAY', () => {
    const days = getVideoDays(2026);
    expect(days[0]).toBe(VIDEO_START_DAY);
  });

  it('spaces days approximately VIDEO_INTERVAL apart', () => {
    const days = getVideoDays(2026);
    for (let i = 1; i < days.length; i++) {
      const gap = days[i] - days[i - 1];
      // Due to rounding, gap should be close to VIDEO_INTERVAL (12.1)
      expect(gap).toBeGreaterThanOrEqual(11);
      expect(gap).toBeLessThanOrEqual(13);
    }
  });

  it('generates approximately TOTAL_VIDEOS days in a standard year', () => {
    const days = getVideoDays(2026);
    expect(days.length).toBe(TOTAL_VIDEOS);
  });

  it('handles leap years (366 days)', () => {
    const days2028 = getVideoDays(2028);
    const days2026 = getVideoDays(2026);
    // Leap year has one more day, so might get one more video day
    expect(days2028.length).toBeGreaterThanOrEqual(days2026.length);
  });
});

describe('isVideoDay', () => {
  it('returns true for video days', () => {
    const videoDays = getVideoDays(2026);
    expect(isVideoDay(videoDays[0], 2026)).toBe(true);
    expect(isVideoDay(videoDays[videoDays.length - 1], 2026)).toBe(true);
  });

  it('returns false for non-video days', () => {
    // Day 1 is before VIDEO_START_DAY (13), so it should not be a video day
    expect(isVideoDay(1, 2026)).toBe(false);
  });
});

describe('getVideoIndex', () => {
  it('returns an index within [0, TOTAL_VIDEOS)', () => {
    const date = new Date(2026, 0, 15);
    const idx = getVideoIndex(date);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(TOTAL_VIDEOS);
  });

  it('is deterministic for the same date', () => {
    const date = new Date(2026, 3, 10);
    expect(getVideoIndex(date)).toBe(getVideoIndex(date));
  });

  it('produces different indices for different dates', () => {
    const indices = new Set<number>();
    for (let d = 1; d <= 30; d++) {
      indices.add(getVideoIndex(new Date(2026, 0, d)));
    }
    // With 30 dates and 30 videos, we should see variety
    expect(indices.size).toBeGreaterThan(1);
  });
});

describe('Fisher-Yates shuffle correctness', () => {
  it('produces a valid permutation (no missing/duplicate indices)', () => {
    const totalImages = 50;
    const date = new Date(2026, 0, 1);

    // Manually run the shuffle logic from getDailyImageIndex
    const indices = Array.from({ length: totalImages }, (_, i) => i);
    let seed = date.getFullYear();
    for (let i = indices.length - 1; i > 0; i--) {
      seed = lcgNext(seed);
      const j = seed % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Should contain exactly [0..49] with no duplicates
    const sorted = [...indices].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: totalImages }, (_, i) => i));
  });

  it('produces different permutations for different years', () => {
    const totalImages = 50;

    function shuffle(year: number): number[] {
      const indices = Array.from({ length: totalImages }, (_, i) => i);
      let seed = year;
      for (let i = indices.length - 1; i > 0; i--) {
        seed = lcgNext(seed);
        const j = seed % (i + 1);
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return indices;
    }

    const perm2026 = shuffle(2026);
    const perm2027 = shuffle(2027);

    // Permutations should differ
    expect(perm2026).not.toEqual(perm2027);
  });
});
