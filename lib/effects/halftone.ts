import { getLuminance } from "../utils";

export interface HalftoneSettings {
  dotSize: number;   // 2-20
  spacing: number;   // 4-30
  angle: number;     // 0-90 degrees
}

export const defaultHalftoneSettings: HalftoneSettings = {
  dotSize: 6,
  spacing: 10,
  angle: 15,
};

export function applyHalftone(
  imageData: ImageData,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  settings: HalftoneSettings
): void {
  const { data, width, height } = imageData;
  const { dotSize, spacing, angle } = settings;
  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  for (let gy = -spacing; gy < height + spacing; gy += spacing) {
    for (let gx = -spacing; gx < width + spacing; gx += spacing) {
      // Rotate grid
      const rx = Math.round(gx * cosA - gy * sinA);
      const ry = Math.round(gx * sinA + gy * cosA);

      // Reverse rotate to find source pixel
      const sx = Math.round(rx * cosA + ry * sinA);
      const sy = Math.round(-rx * sinA + ry * cosA);

      if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;

      const idx = (sy * width + sx) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = getLuminance(r, g, b) / 255;

      const radius = (1 - lum) * dotSize * 0.5;
      if (radius < 0.5) continue;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
