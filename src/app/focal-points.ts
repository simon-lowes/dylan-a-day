// Jev (TypeSafe) focal points for the Ken Burns pan. Jev judges where Dylan is
// (a Box per image, computed offline by scripts/jev-focal-points.mjs); this
// code decides how to frame it. No entry for an image = today's behaviour.
import data from "./focal-points.json";

export type FocalPoint = { x: number; y: number }; // 0..1 of image width/height
export type JevBox = { top: number; bottom: number; left: number; right: number };

const FOCAL_POINTS = data as Record<string, FocalPoint>;

export function focalPointFromBox(b: JevBox, width: number, height: number): FocalPoint | null {
  // Box may come back in pixels or 0..1; normalise either way.
  const sx = b.right > 1 || b.left > 1 ? width : 1;
  const sy = b.bottom > 1 || b.top > 1 ? height : 1;
  const x = (b.left + b.right) / 2 / sx;
  const y = (b.top + b.bottom) / 2 / sy;
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

export function getFocalPoint(index: number): FocalPoint | undefined {
  return FOCAL_POINTS[String(index)];
}

// CSS for object-position / transform-origin, or undefined to keep defaults.
export function focalStyle(fp: FocalPoint | undefined): { objectPosition: string; transformOrigin: string } | undefined {
  if (!fp) return undefined;
  const pos = `${(fp.x * 100).toFixed(1)}% ${(fp.y * 100).toFixed(1)}%`;
  return { objectPosition: pos, transformOrigin: pos };
}
