import { describe, it, expect } from "vitest";
import { focalPointFromBox, focalStyle, getFocalPoint } from "../focal-points";

describe("focal points", () => {
  it("centres a normalised box", () => {
    expect(focalPointFromBox({ top: 0.2, bottom: 0.4, left: 0.6, right: 0.8 }, 100, 100)).toEqual({ x: 0.7, y: 0.30000000000000004 });
  });
  it("normalises a pixel box", () => {
    expect(focalPointFromBox({ top: 0, bottom: 200, left: 100, right: 300 }, 400, 400)).toEqual({ x: 0.5, y: 0.25 });
  });
  it("falls back when no focal point", () => {
    expect(getFocalPoint(999999)).toBeUndefined();
    expect(focalStyle(undefined)).toBeUndefined();
    expect(focalStyle({ x: 0.5, y: 0.25 })).toEqual({ objectPosition: "50.0% 25.0%", transformOrigin: "50.0% 25.0%" });
  });
});
