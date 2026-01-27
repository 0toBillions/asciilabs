import { clamp, getLuminance } from "../utils";

export interface EdgeDetectSettings {
  threshold: number; // 0-255
  invert: boolean;
}

export const defaultEdgeDetectSettings: EdgeDetectSettings = {
  threshold: 50,
  invert: false,
};

export function applyEdgeDetection(imageData: ImageData, settings: EdgeDetectSettings): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  // Sobel kernels
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0;
      let sumY = 0;
      let ki = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = gray[(y + ky) * width + (x + kx)];
          sumX += pixel * gx[ki];
          sumY += pixel * gy[ki];
          ki++;
        }
      }

      let magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
      magnitude = magnitude > settings.threshold ? 255 : 0;
      if (settings.invert) magnitude = 255 - magnitude;

      const idx = (y * width + x) * 4;
      out[idx] = magnitude;
      out[idx + 1] = magnitude;
      out[idx + 2] = magnitude;
      out[idx + 3] = 255;
    }
  }

  return result;
}
