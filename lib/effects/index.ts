export { renderAscii, defaultAsciiSettings } from "./ascii";
export type { AsciiSettings } from "./ascii";

export { applyDithering, defaultDitheringSettings } from "./dithering";
export type { DitheringSettings } from "./dithering";

export { MatrixRainRenderer, defaultMatrixRainSettings } from "./matrixRain";
export type { MatrixRainSettings } from "./matrixRain";

export { applyEdgeDetection, defaultEdgeDetectSettings } from "./edgeDetect";
export type { EdgeDetectSettings } from "./edgeDetect";

export { applyHalftone, defaultHalftoneSettings } from "./halftone";
export type { HalftoneSettings } from "./halftone";

export { applyPixelate, defaultPixelateSettings } from "./pixelate";
export type { PixelateSettings } from "./pixelate";

export { applyScanlines, defaultScanlineSettings } from "./scanlines";
export type { ScanlineSettings } from "./scanlines";

export type EffectType =
  | "ascii"
  | "floyd-steinberg"
  | "atkinson"
  | "ordered"
  | "matrix-rain"
  | "edge-detect"
  | "halftone"
  | "pixelate"
  | "scanlines";

export const EFFECT_LIST: { id: EffectType; label: string; description: string }[] = [
  { id: "ascii", label: "ASCII Art", description: "Map pixels to characters by brightness" },
  { id: "floyd-steinberg", label: "Floyd-Steinberg Dither", description: "Error diffusion dithering" },
  { id: "atkinson", label: "Atkinson Dither", description: "Higher contrast dithering" },
  { id: "ordered", label: "Ordered Dither", description: "Bayer matrix ordered dithering" },
  { id: "matrix-rain", label: "Matrix Rain", description: "Falling green characters animation" },
  { id: "edge-detect", label: "Edge Detection", description: "Sobel operator edge outlines" },
  { id: "halftone", label: "Halftone", description: "CMYK-style dot pattern" },
  { id: "pixelate", label: "Pixel Art", description: "Block-level color averaging" },
  { id: "scanlines", label: "Scanlines", description: "CRT monitor horizontal lines" },
];
