"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import Canvas from "@/components/Canvas";
import EffectSelector from "@/components/EffectSelector";
import SettingsPanel, { AllSettings } from "@/components/SettingsPanel";
import ExportPanel from "@/components/ExportButton";
import MintNFT from "@/components/nft/MintNFT";
import { EffectType, EFFECT_LIST } from "@/lib/effects";
import { defaultAsciiSettings } from "@/lib/effects/ascii";
import { defaultDitheringSettings } from "@/lib/effects/dithering";
import { defaultMatrixRainSettings } from "@/lib/effects/matrixRain";
import { defaultEdgeDetectSettings } from "@/lib/effects/edgeDetect";
import { defaultHalftoneSettings } from "@/lib/effects/halftone";
import { defaultPixelateSettings } from "@/lib/effects/pixelate";
import { defaultScanlineSettings } from "@/lib/effects/scanlines";
import { loadMedia, cleanupMedia, LoadedMedia } from "@/lib/imageLoader";

const DEFAULT_SETTINGS: AllSettings = {
  ascii: defaultAsciiSettings,
  dithering: defaultDitheringSettings,
  matrixRain: defaultMatrixRainSettings,
  edgeDetect: defaultEdgeDetectSettings,
  halftone: defaultHalftoneSettings,
  pixelate: defaultPixelateSettings,
  scanlines: defaultScanlineSettings,
  scale: 1,
};

export default function Home() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [effect, setEffect] = useState<EffectType>("ascii");
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [asciiText, setAsciiText] = useState("");
  const [fileName, setFileName] = useState("");
  const [resolution, setResolution] = useState("");
  const [animated, setAnimated] = useState(false);
  const [getFrame, setGetFrame] = useState<(() => ImageData) | undefined>();
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<LoadedMedia | null>(null);

  const effectLabel = EFFECT_LIST.find((e) => e.id === effect)?.label || effect;

  const handleFile = useCallback(async (file: File) => {
    if (mediaRef.current) {
      cleanupMedia(mediaRef.current);
      mediaRef.current = null;
    }
    setFileName(file.name);
    const media = await loadMedia(file);
    mediaRef.current = media;
    setImageData(media.imageData);
    setResolution(`${media.width} x ${media.height}`);
    setAnimated(media.animated);
    setGetFrame(media.getFrame ? () => media.getFrame! : undefined);
  }, []);

  const handleClear = useCallback(() => {
    if (mediaRef.current) {
      cleanupMedia(mediaRef.current);
      mediaRef.current = null;
    }
    setImageData(null);
    setFileName("");
    setResolution("");
    setAnimated(false);
    setGetFrame(undefined);
    setAsciiText("");
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRef.current) cleanupMedia(mediaRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-300">
      {/* Top bar */}
      <div className="h-8 flex items-center justify-center border-b border-zinc-800/50 text-xs text-zinc-500 gap-2 flex-shrink-0">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span className="text-zinc-300">{effectLabel}</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950 overflow-y-auto flex flex-col">
          <div className="p-4 pb-2">
            <h1 className="text-base font-bold text-zinc-100 tracking-wide">ASCII LABS</h1>
          </div>

          {/* Input section */}
          <div className="px-4 pb-3">
            <SectionHeader title="Input" defaultOpen={true}>
              {fileName ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Image loaded</span>
                    <button onClick={handleClear} className="text-zinc-400 hover:text-zinc-200">Clear</button>
                  </div>
                  {resolution && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Resolution</span>
                      <span className="text-zinc-400">{resolution}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">File</span>
                    <span className="text-zinc-400 truncate ml-4 max-w-[120px]" title={fileName}>{fileName}</span>
                  </div>
                </div>
              ) : null}
              <FileUpload onFileLoaded={handleFile} />
            </SectionHeader>
          </div>

          {/* Effects section */}
          <div className="px-4 pb-3 flex-1">
            <SectionHeader title="Effects" defaultOpen={true}>
              <EffectSelector selected={effect} onSelect={setEffect} />
            </SectionHeader>
          </div>

          {/* Presets section */}
          <div className="px-4 pb-3">
            <SectionHeader title="Presets" defaultOpen={false}>
              <p className="text-xs text-zinc-600">No presets saved</p>
            </SectionHeader>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 mt-auto border-t border-zinc-800/50 text-xs text-zinc-600 flex gap-4">
            <span>Follow</span>
            <span>About</span>
            <span>Changelog</span>
          </div>
        </aside>

        {/* Center canvas area */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-900/30">
            <Canvas
              imageData={imageData}
              effect={effect}
              settings={settings}
              onAsciiText={setAsciiText}
              canvasRef={canvasRef}
              animated={animated}
              getFrame={getFrame}
            />
          </div>
          {/* Bottom status bar */}
          <div className="h-7 flex items-center justify-between px-4 border-t border-zinc-800/50 text-xs text-zinc-600 flex-shrink-0">
            <span>Scroll to pan · Ctrl+Scroll to zoom · Alt+Drag to pan</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="hover:text-zinc-400">−</button>
              <span className="text-zinc-400 w-8 text-center">{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="hover:text-zinc-400">+</button>
              <span className="text-zinc-700 mx-1">|</span>
              <button onClick={() => setZoom(100)} className="hover:text-zinc-400">Reset</button>
              <span className="text-zinc-400">100%</span>
            </div>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-72 flex-shrink-0 border-l border-zinc-800/50 bg-zinc-950 overflow-y-auto">
          <SettingsPanel effect={effect} settings={settings} onChange={setSettings} />
          <ExportPanel canvasRef={canvasRef} asciiText={asciiText} effect={effect} />
          {imageData && (
            <div className="px-4 pb-4">
              <SectionHeader title="Mint NFT" defaultOpen={true}>
                <MintNFT canvasRef={canvasRef} effectName={effectLabel} />
              </SectionHeader>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({
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
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-100 w-full text-left py-1.5"
      >
        <span className="text-zinc-500 text-xs">{open ? "−" : "+"}</span>
        <span>{title}</span>
      </button>
      {open && <div className="space-y-2 mt-1">{children}</div>}
    </div>
  );
}
