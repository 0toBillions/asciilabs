import { clamp, findClosestColor, Color, PALETTES } from "../utils";

export interface DitheringSettings {
  algorithm: "floyd-steinberg" | "atkinson" | "ordered";
  palette: string;
  matrixSize: 2 | 4 | 8;
}

export const defaultDitheringSettings: DitheringSettings = {
  algorithm: "floyd-steinberg",
  palette: "bw",
  matrixSize: 4,
};

function copyImageData(src: ImageData): ImageData {
  const dst = new ImageData(src.width, src.height);
  dst.data.set(src.data);
  return dst;
}

export function applyDithering(imageData: ImageData, settings: DitheringSettings): ImageData {
  switch (settings.algorithm) {
    case "floyd-steinberg":
      return floydSteinberg(imageData, settings.palette);
    case "atkinson":
      return atkinson(imageData, settings.palette);
    case "ordered":
      return orderedDither(imageData, settings.palette, settings.matrixSize);
  }
}

function floydSteinberg(imageData: ImageData, paletteName: string): ImageData {
  const result = copyImageData(imageData);
  const { data, width, height } = result;
  const palette = PALETTES[paletteName] || PALETTES.bw;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const oldR = data[idx];
      const oldG = data[idx + 1];
      const oldB = data[idx + 2];

      const nearest = findClosestColor(oldR, oldG, oldB, palette);
      data[idx] = nearest.r;
      data[idx + 1] = nearest.g;
      data[idx + 2] = nearest.b;

      const errR = oldR - nearest.r;
      const errG = oldG - nearest.g;
      const errB = oldB - nearest.b;

      distributeError(data, width, height, x + 1, y, errR, errG, errB, 7 / 16);
      distributeError(data, width, height, x - 1, y + 1, errR, errG, errB, 3 / 16);
      distributeError(data, width, height, x, y + 1, errR, errG, errB, 5 / 16);
      distributeError(data, width, height, x + 1, y + 1, errR, errG, errB, 1 / 16);
    }
  }
  return result;
}

function atkinson(imageData: ImageData, paletteName: string): ImageData {
  const result = copyImageData(imageData);
  const { data, width, height } = result;
  const palette = PALETTES[paletteName] || PALETTES.bw;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const oldR = data[idx];
      const oldG = data[idx + 1];
      const oldB = data[idx + 2];

      const nearest = findClosestColor(oldR, oldG, oldB, palette);
      data[idx] = nearest.r;
      data[idx + 1] = nearest.g;
      data[idx + 2] = nearest.b;

      // Atkinson distributes 6/8 of error (75%)
      const errR = oldR - nearest.r;
      const errG = oldG - nearest.g;
      const errB = oldB - nearest.b;
      const f = 1 / 8;

      distributeError(data, width, height, x + 1, y, errR, errG, errB, f);
      distributeError(data, width, height, x + 2, y, errR, errG, errB, f);
      distributeError(data, width, height, x - 1, y + 1, errR, errG, errB, f);
      distributeError(data, width, height, x, y + 1, errR, errG, errB, f);
      distributeError(data, width, height, x + 1, y + 1, errR, errG, errB, f);
      distributeError(data, width, height, x, y + 2, errR, errG, errB, f);
    }
  }
  return result;
}

const BAYER_2 = [
  [0, 2],
  [3, 1],
];

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER_8 = generateBayer8();

function generateBayer8(): number[][] {
  const size = 8;
  const m: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      let xc = x ^ y;
      let yc = y;
      for (let bit = 0; bit < 3; bit++) {
        v = (v << 2) | (((yc & 1) << 1) | (xc & 1));
        xc >>= 1;
        yc >>= 1;
      }
      m[y][x] = v;
    }
  }
  return m;
}

function orderedDither(imageData: ImageData, paletteName: string, matrixSize: 2 | 4 | 8): ImageData {
  const result = copyImageData(imageData);
  const { data, width, height } = result;
  const palette = PALETTES[paletteName] || PALETTES.bw;
  const matrix = matrixSize === 2 ? BAYER_2 : matrixSize === 4 ? BAYER_4 : BAYER_8;
  const n = matrix.length;
  const levels = n * n;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const threshold = (matrix[y % n][x % n] / levels - 0.5) * 64;

      const r = clamp(data[idx] + threshold, 0, 255);
      const g = clamp(data[idx + 1] + threshold, 0, 255);
      const b = clamp(data[idx + 2] + threshold, 0, 255);

      const nearest = findClosestColor(r, g, b, palette);
      data[idx] = nearest.r;
      data[idx + 1] = nearest.g;
      data[idx + 2] = nearest.b;
    }
  }
  return result;
}

function distributeError(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  errR: number,
  errG: number,
  errB: number,
  factor: number
): void {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  data[idx] = clamp(data[idx] + errR * factor, 0, 255);
  data[idx + 1] = clamp(data[idx + 1] + errG * factor, 0, 255);
  data[idx + 2] = clamp(data[idx + 2] + errB * factor, 0, 255);
}
