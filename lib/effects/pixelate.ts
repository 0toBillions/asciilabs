import { findClosestColor, PALETTES } from "../utils";

export interface PixelateSettings {
  blockSize: number; // 2-32
  palette: string;   // "none" for original colors
}

export const defaultPixelateSettings: PixelateSettings = {
  blockSize: 8,
  palette: "none",
};

export function applyPixelate(imageData: ImageData, settings: PixelateSettings): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;
  const { blockSize, palette } = settings;
  const usePalette = palette !== "none" && PALETTES[palette];

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      let totalR = 0, totalG = 0, totalB = 0, count = 0;

      const endY = Math.min(by + blockSize, height);
      const endX = Math.min(bx + blockSize, width);

      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const idx = (y * width + x) * 4;
          totalR += data[idx];
          totalG += data[idx + 1];
          totalB += data[idx + 2];
          count++;
        }
      }

      let avgR = Math.round(totalR / count);
      let avgG = Math.round(totalG / count);
      let avgB = Math.round(totalB / count);

      if (usePalette) {
        const c = findClosestColor(avgR, avgG, avgB, PALETTES[palette]);
        avgR = c.r;
        avgG = c.g;
        avgB = c.b;
      }

      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const idx = (y * width + x) * 4;
          out[idx] = avgR;
          out[idx + 1] = avgG;
          out[idx + 2] = avgB;
          out[idx + 3] = 255;
        }
      }
    }
  }

  return result;
}
