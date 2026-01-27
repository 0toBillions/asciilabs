import { getLuminance, clamp } from "../utils";

const CHARSETS: Record<string, string> = {
  standard: " .:-=+*#%@",
  blocks: " ░▒▓█",
  binary: " 01",
  detailed: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  minimal: " .oO@",
  alphabetic: " abcdefghijklmnopqrstuvwxyz",
  numeric: " 0123456789",
  math: " +-=<>~^*/|\\%",
  symbols: " !@#$%^&*()_+-=[]{}|;:',.<>?/~`",
  braille: " ⠁⠃⠇⠏⠟⠿⡿⣿",
  matrix: " 0123456789ABCDEFabcdef@#$%",
};

export interface AsciiSettings {
  charset: string;
  scale: number;          // 0-20, controls character density (like font size inverse)
  spacing: number;        // 0.0-1.0, space between characters
  outputWidth: number;    // 0-500, number of columns
  colorMode: "original" | "green" | "mono" | "custom";
  characterColor: string; // used in custom mode
  backgroundColor: string;
  intensity: number;      // 0.0-2.0
  invert: boolean;
  // Adjustments
  brightness: number;     // -100 to 100
  contrast: number;       // -100 to 100
  saturation: number;     // -100 to 100
  hueRotation: number;    // 0-360 degrees
  sharpness: number;      // 0-100
  gamma: number;          // 0.1-3.0
}

export const defaultAsciiSettings: AsciiSettings = {
  charset: "standard",
  scale: 1,
  spacing: 0.2,
  outputWidth: 200,
  colorMode: "original",
  characterColor: "#09C816",
  backgroundColor: "#000000",
  intensity: 1.0,
  invert: false,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hueRotation: 0,
  sharpness: 0,
  gamma: 1.0,
};

function adjustPixel(
  r: number, g: number, b: number,
  brightness: number, contrast: number, saturation: number,
  hueRotation: number, gamma: number, intensity: number
): [number, number, number] {
  // Brightness
  r += brightness * 2.55;
  g += brightness * 2.55;
  b += brightness * 2.55;

  // Contrast
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  r = factor * (r - 128) + 128;
  g = factor * (g - 128) + 128;
  b = factor * (b - 128) + 128;

  // Saturation
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const satFactor = 1 + saturation / 100;
  r = gray + satFactor * (r - gray);
  g = gray + satFactor * (g - gray);
  b = gray + satFactor * (b - gray);

  // Hue rotation (simplified via rotation matrix)
  if (hueRotation !== 0) {
    const rad = (hueRotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nr = r * (0.213 + cos * 0.787 - sin * 0.213) +
               g * (0.715 - cos * 0.715 - sin * 0.715) +
               b * (0.072 - cos * 0.072 + sin * 0.928);
    const ng = r * (0.213 - cos * 0.213 + sin * 0.143) +
               g * (0.715 + cos * 0.285 + sin * 0.140) +
               b * (0.072 - cos * 0.072 - sin * 0.283);
    const nb = r * (0.213 - cos * 0.213 - sin * 0.787) +
               g * (0.715 - cos * 0.715 + sin * 0.715) +
               b * (0.072 + cos * 0.928 + sin * 0.072);
    r = nr; g = ng; b = nb;
  }

  // Gamma
  if (gamma !== 1.0) {
    const invGamma = 1 / gamma;
    r = 255 * Math.pow(clamp(r, 0, 255) / 255, invGamma);
    g = 255 * Math.pow(clamp(g, 0, 255) / 255, invGamma);
    b = 255 * Math.pow(clamp(b, 0, 255) / 255, invGamma);
  }

  // Intensity
  r *= intensity;
  g *= intensity;
  b *= intensity;

  return [clamp(Math.round(r), 0, 255), clamp(Math.round(g), 0, 255), clamp(Math.round(b), 0, 255)];
}

export function renderAscii(
  sourceImageData: ImageData,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  settings: AsciiSettings
): string {
  const {
    charset, scale, spacing, outputWidth, colorMode, characterColor, backgroundColor,
    intensity, invert, brightness, contrast, saturation, hueRotation,
    sharpness, gamma,
  } = settings;

  // Parse characterColor hex for custom mode
  const ccR = parseInt(characterColor.slice(1, 3), 16) || 0;
  const ccG = parseInt(characterColor.slice(3, 5), 16) || 0;
  const ccB = parseInt(characterColor.slice(5, 7), 16) || 0;
  const chars = CHARSETS[charset] || CHARSETS.standard;
  const { data, width, height } = sourceImageData;

  // Scale controls character size: higher scale = bigger chars = fewer columns
  const baseSize = 4 + scale * 1.5;
  const cols = Math.min(outputWidth, Math.floor(canvasWidth / (baseSize * (0.6 + spacing * 0.4))));
  const cellW = canvasWidth / cols;
  const cellH = cellW * (1.6 + spacing * 0.8);
  const rows = Math.floor(canvasHeight / cellH);

  const fontSize = Math.max(4, cellH * 0.9);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";

  const lines: string[] = [];

  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      // Sample from source image
      const sx = Math.floor((col / cols) * width);
      const sy = Math.floor((row / rows) * height);
      const idx = (sy * width + sx) * 4;

      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      // Apply adjustments
      [r, g, b] = adjustPixel(r, g, b, brightness, contrast, saturation, hueRotation, gamma, intensity);

      let lum = getLuminance(r, g, b) / 255;
      if (invert) lum = 1 - lum;
      const charIdx = Math.floor(lum * (chars.length - 1));
      const char = chars[charIdx];
      line += char;

      // Color
      if (colorMode === "original") {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } else if (colorMode === "green") {
        const bright = Math.round(lum * 255);
        ctx.fillStyle = `rgb(0,${bright},0)`;
      } else if (colorMode === "custom") {
        const bright = lum;
        ctx.fillStyle = `rgb(${Math.round(ccR * bright)},${Math.round(ccG * bright)},${Math.round(ccB * bright)})`;
      } else {
        const bright = Math.round(lum * 255);
        ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
      }
      ctx.fillText(char, col * cellW, row * cellH);
    }
    lines.push(line);
  }

  return lines.join("\n");
}
