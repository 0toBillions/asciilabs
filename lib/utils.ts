export function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rgbToGray(r: number, g: number, b: number): number {
  return Math.round(getLuminance(r, g, b));
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export const PALETTES: Record<string, Color[]> = {
  bw: [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
  ],
  cga: [
    { r: 0, g: 0, b: 0 },
    { r: 0, g: 170, b: 170 },
    { r: 170, g: 0, b: 170 },
    { r: 170, g: 170, b: 170 },
  ],
  gameboy: [
    { r: 15, g: 56, b: 15 },
    { r: 48, g: 98, b: 48 },
    { r: 139, g: 172, b: 15 },
    { r: 155, g: 188, b: 15 },
  ],
  sepia: [
    { r: 44, g: 28, b: 10 },
    { r: 100, g: 70, b: 35 },
    { r: 180, g: 140, b: 80 },
    { r: 240, g: 210, b: 160 },
  ],
  neon: [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 0, b: 128 },
    { r: 0, g: 255, b: 128 },
    { r: 0, g: 128, b: 255 },
    { r: 255, g: 255, b: 0 },
  ],
};

export function findClosestColor(r: number, g: number, b: number, palette: Color[]): Color {
  let minDist = Infinity;
  let closest = palette[0];
  for (const c of palette) {
    const dr = r - c.r;
    const dg = g - c.g;
    const db = b - c.b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDist) {
      minDist = dist;
      closest = c;
    }
  }
  return closest;
}

export function quantizeColor(value: number, levels: number): number {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}
