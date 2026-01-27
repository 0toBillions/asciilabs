export interface ScanlineSettings {
  lineWidth: number; // 1-5
  opacity: number;   // 0-1
  gap: number;       // 1-10
}

export const defaultScanlineSettings: ScanlineSettings = {
  lineWidth: 2,
  opacity: 0.5,
  gap: 4,
};

export function applyScanlines(imageData: ImageData, settings: ScanlineSettings): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;
  out.set(data);

  const { lineWidth, opacity, gap } = settings;
  const period = lineWidth + gap;

  for (let y = 0; y < height; y++) {
    const posInPeriod = y % period;
    if (posInPeriod < lineWidth) {
      const darken = 1 - opacity;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        out[idx] = Math.round(out[idx] * darken);
        out[idx + 1] = Math.round(out[idx + 1] * darken);
        out[idx + 2] = Math.round(out[idx + 2] * darken);
      }
    }
  }

  return result;
}
