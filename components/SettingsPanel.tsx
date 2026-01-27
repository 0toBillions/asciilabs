"use client";

import { useState } from "react";
import { EffectType, EFFECT_LIST } from "@/lib/effects";
import type { AsciiSettings } from "@/lib/effects/ascii";
import type { DitheringSettings } from "@/lib/effects/dithering";
import type { MatrixRainSettings } from "@/lib/effects/matrixRain";
import type { EdgeDetectSettings } from "@/lib/effects/edgeDetect";
import type { HalftoneSettings } from "@/lib/effects/halftone";
import type { PixelateSettings } from "@/lib/effects/pixelate";
import type { ScanlineSettings } from "@/lib/effects/scanlines";

export interface AllSettings {
  ascii: AsciiSettings;
  dithering: DitheringSettings;
  matrixRain: MatrixRainSettings;
  edgeDetect: EdgeDetectSettings;
  halftone: HalftoneSettings;
  pixelate: PixelateSettings;
  scanlines: ScanlineSettings;
  scale: number;
}

interface SettingsPanelProps {
  effect: EffectType;
  settings: AllSettings;
  onChange: (settings: AllSettings) => void;
}

/* ─── Primitives ─── */

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onReset,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onReset?: () => void;
}) {
  const display = step < 1 ? value.toFixed(1) : String(value);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-zinc-300 w-8 text-right flex-shrink-0">{display}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-green-500"
      />
      {onReset && (
        <button onClick={onReset} className="text-[10px] text-zinc-600 hover:text-zinc-400 flex-shrink-0">
          reset
        </button>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-24 flex-shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded bg-zinc-800 border border-zinc-700/50 text-zinc-200 px-2 py-1 text-xs uppercase"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-24 flex-shrink-0">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-green-500 w-3.5 h-3.5"
      />
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1">
        <div className="relative">
          <div
            className="w-6 h-6 rounded border border-zinc-700/50 cursor-pointer"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-xs text-zinc-300 font-mono">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-zinc-800/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 w-full text-left py-2.5 px-4"
      >
        <span className="text-zinc-500">{open ? "−" : "+"}</span>
        <span>{title}</span>
      </button>
      {open && <div className="space-y-2.5 px-4 pb-3">{children}</div>}
    </div>
  );
}

/* ─── Options ─── */

const PALETTE_OPTIONS = [
  { value: "bw", label: "Black & White" },
  { value: "cga", label: "CGA" },
  { value: "gameboy", label: "Game Boy" },
  { value: "sepia", label: "Sepia" },
  { value: "neon", label: "Neon" },
];

const CHARSET_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "blocks", label: "Blocks" },
  { value: "binary", label: "Binary" },
  { value: "detailed", label: "Detailed" },
  { value: "minimal", label: "Minimal" },
  { value: "alphabetic", label: "Alphabetic" },
  { value: "numeric", label: "Numeric" },
  { value: "math", label: "Math" },
  { value: "symbols", label: "Symbols" },
  { value: "braille", label: "Braille" },
  { value: "matrix", label: "Matrix" },
];

/* ─── Main ─── */

export default function SettingsPanel({ effect, settings, onChange }: SettingsPanelProps) {
  const update = (key: keyof AllSettings, partial: Record<string, unknown>) => {
    const current = settings[key];
    if (typeof current === "object" && current !== null) {
      onChange({ ...settings, [key]: { ...current, ...partial } });
    }
  };

  const effectLabel = EFFECT_LIST.find((e) => e.id === effect)?.label || effect;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/30">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-xs">−</span>
          <span className="text-sm font-bold text-zinc-100">Settings</span>
        </div>
        <button className="text-xs text-zinc-500 hover:text-zinc-300">Reset</button>
      </div>

      {/* Effect-specific settings */}
      <div className="px-4 pt-2.5 pb-1">
        <span className="text-xs font-bold text-zinc-300">{effectLabel}</span>
      </div>

      {/* ===== ASCII ===== */}
      {effect === "ascii" && (
        <>
          <div className="space-y-2.5 px-4 py-2">
            <Select label="Character Set" value={settings.ascii.charset} options={CHARSET_OPTIONS} onChange={(v) => update("ascii", { charset: v })} />
            <Slider label="Scale" value={settings.ascii.scale} min={0} max={20} onChange={(v) => update("ascii", { scale: v })} />
            <Slider label="Spacing" value={settings.ascii.spacing} min={0} max={1} step={0.1} onChange={(v) => update("ascii", { spacing: v })} />
            <Slider label="Output Width" value={settings.ascii.outputWidth} min={10} max={500} onChange={(v) => update("ascii", { outputWidth: v })} onReset={() => update("ascii", { outputWidth: 200 })} />
          </div>

          <Section title="Adjustments">
            <Slider label="Brightness" value={settings.ascii.brightness} min={-100} max={100} onChange={(v) => update("ascii", { brightness: v })} onReset={() => update("ascii", { brightness: 0 })} />
            <Slider label="Contrast" value={settings.ascii.contrast} min={-100} max={100} onChange={(v) => update("ascii", { contrast: v })} onReset={() => update("ascii", { contrast: 0 })} />
            <Slider label="Saturation" value={settings.ascii.saturation} min={-100} max={100} onChange={(v) => update("ascii", { saturation: v })} onReset={() => update("ascii", { saturation: 0 })} />
            <Slider label="Hue Rotation" value={settings.ascii.hueRotation} min={0} max={360} onChange={(v) => update("ascii", { hueRotation: v })} onReset={() => update("ascii", { hueRotation: 0 })} />
            <Slider label="Sharpness" value={settings.ascii.sharpness} min={0} max={100} onChange={(v) => update("ascii", { sharpness: v })} onReset={() => update("ascii", { sharpness: 0 })} />
            <Slider label="Gamma" value={settings.ascii.gamma} min={0.1} max={3.0} step={0.1} onChange={(v) => update("ascii", { gamma: v })} onReset={() => update("ascii", { gamma: 1.0 })} />
          </Section>

          <Section title="Color">
            <Select label="Mode" value={settings.ascii.colorMode} options={[
              { value: "original", label: "Original" },
              { value: "green", label: "Green" },
              { value: "mono", label: "Monochrome" },
              { value: "custom", label: "Custom" },
            ]} onChange={(v) => update("ascii", { colorMode: v })} />
            {settings.ascii.colorMode === "custom" && (
              <ColorInput label="Char Color" value={settings.ascii.characterColor} onChange={(v) => update("ascii", { characterColor: v })} />
            )}
            <ColorInput label="Background" value={settings.ascii.backgroundColor} onChange={(v) => update("ascii", { backgroundColor: v })} />
            <Slider label="Intensity" value={settings.ascii.intensity} min={0} max={2} step={0.1} onChange={(v) => update("ascii", { intensity: v })} />
          </Section>

          <Section title="Processing" defaultOpen={false}>
            <Toggle label="Invert" value={settings.ascii.invert} onChange={(v) => update("ascii", { invert: v })} />
          </Section>

          <Section title="Post-Processing" defaultOpen={false}>
            <p className="text-xs text-zinc-600">No post-processing options</p>
          </Section>
        </>
      )}

      {/* ===== Dithering ===== */}
      {(effect === "floyd-steinberg" || effect === "atkinson" || effect === "ordered") && (
        <div className="space-y-2.5 px-4 py-2">
          <Select label="Palette" value={settings.dithering.palette} options={PALETTE_OPTIONS} onChange={(v) => update("dithering", { palette: v })} />
          {effect === "ordered" && (
            <Select label="Matrix Size" value={String(settings.dithering.matrixSize)} options={[
              { value: "2", label: "2x2" },
              { value: "4", label: "4x4" },
              { value: "8", label: "8x8" },
            ]} onChange={(v) => update("dithering", { matrixSize: Number(v) as 2 | 4 | 8 })} />
          )}
        </div>
      )}

      {/* ===== Matrix Rain ===== */}
      {effect === "matrix-rain" && (
        <div className="space-y-2.5 px-4 py-2">
          <Slider label="Speed" value={settings.matrixRain.speed} min={1} max={10} onChange={(v) => update("matrixRain", { speed: v })} />
          <Slider label="Density" value={settings.matrixRain.density} min={0.01} max={0.1} step={0.01} onChange={(v) => update("matrixRain", { density: v })} />
          <Slider label="Trail Length" value={settings.matrixRain.trailLength} min={5} max={30} onChange={(v) => update("matrixRain", { trailLength: v })} />
          <Slider label="Font Size" value={settings.matrixRain.fontSize} min={8} max={24} onChange={(v) => update("matrixRain", { fontSize: v })} />
        </div>
      )}

      {/* ===== Edge Detection ===== */}
      {effect === "edge-detect" && (
        <div className="space-y-2.5 px-4 py-2">
          <Slider label="Threshold" value={settings.edgeDetect.threshold} min={0} max={255} onChange={(v) => update("edgeDetect", { threshold: v })} />
          <Toggle label="Invert" value={settings.edgeDetect.invert} onChange={(v) => update("edgeDetect", { invert: v })} />
        </div>
      )}

      {/* ===== Halftone ===== */}
      {effect === "halftone" && (
        <div className="space-y-2.5 px-4 py-2">
          <Slider label="Dot Size" value={settings.halftone.dotSize} min={2} max={20} onChange={(v) => update("halftone", { dotSize: v })} />
          <Slider label="Spacing" value={settings.halftone.spacing} min={4} max={30} onChange={(v) => update("halftone", { spacing: v })} />
          <Slider label="Angle" value={settings.halftone.angle} min={0} max={90} onChange={(v) => update("halftone", { angle: v })} />
        </div>
      )}

      {/* ===== Pixelate ===== */}
      {effect === "pixelate" && (
        <div className="space-y-2.5 px-4 py-2">
          <Slider label="Block Size" value={settings.pixelate.blockSize} min={2} max={32} onChange={(v) => update("pixelate", { blockSize: v })} />
          <Select label="Palette" value={settings.pixelate.palette} options={[{ value: "none", label: "Original Colors" }, ...PALETTE_OPTIONS]} onChange={(v) => update("pixelate", { palette: v })} />
        </div>
      )}

      {/* ===== Scanlines ===== */}
      {effect === "scanlines" && (
        <div className="space-y-2.5 px-4 py-2">
          <Slider label="Line Width" value={settings.scanlines.lineWidth} min={1} max={5} onChange={(v) => update("scanlines", { lineWidth: v })} />
          <Slider label="Opacity" value={settings.scanlines.opacity} min={0.1} max={1} step={0.1} onChange={(v) => update("scanlines", { opacity: v })} />
          <Slider label="Gap" value={settings.scanlines.gap} min={1} max={10} onChange={(v) => update("scanlines", { gap: v })} />
        </div>
      )}
    </div>
  );
}
