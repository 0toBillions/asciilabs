"use client";

import { useRef, useEffect, useCallback } from "react";
import { EffectType } from "@/lib/effects";
import { renderAscii } from "@/lib/effects/ascii";
import { applyDithering } from "@/lib/effects/dithering";
import { MatrixRainRenderer } from "@/lib/effects/matrixRain";
import { applyEdgeDetection } from "@/lib/effects/edgeDetect";
import { applyHalftone } from "@/lib/effects/halftone";
import { applyPixelate } from "@/lib/effects/pixelate";
import { applyScanlines } from "@/lib/effects/scanlines";
import type { AllSettings } from "./SettingsPanel";

interface CanvasProps {
  imageData: ImageData | null;
  effect: EffectType;
  settings: AllSettings;
  onAsciiText?: (text: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  animated?: boolean;
  getFrame?: () => ImageData;
}

export default function Canvas({ imageData, effect, settings, onAsciiText, canvasRef, animated, getFrame }: CanvasProps) {
  const matrixRef = useRef<MatrixRainRenderer | null>(null);
  const animFrameRef = useRef<number>(0);

  const applyEffect = useCallback((src: ImageData, ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Stop matrix if switching away
    if (effect !== "matrix-rain" && matrixRef.current) {
      matrixRef.current.stop();
      matrixRef.current = null;
    }

    switch (effect) {
      case "ascii": {
        const text = renderAscii(src, ctx, w, h, settings.ascii);
        onAsciiText?.(text);
        break;
      }
      case "floyd-steinberg":
      case "atkinson":
      case "ordered": {
        const result = applyDithering(src, {
          ...settings.dithering,
          algorithm: effect,
        });
        ctx.putImageData(result, 0, 0);
        break;
      }
      case "matrix-rain": {
        if (!matrixRef.current) {
          matrixRef.current = new MatrixRainRenderer();
        }
        matrixRef.current.stop();
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
        matrixRef.current.start(ctx, w, h, settings.matrixRain, src);
        break;
      }
      case "edge-detect": {
        const result = applyEdgeDetection(src, settings.edgeDetect);
        ctx.putImageData(result, 0, 0);
        break;
      }
      case "halftone": {
        applyHalftone(src, ctx, w, h, settings.halftone);
        break;
      }
      case "pixelate": {
        const result = applyPixelate(src, settings.pixelate);
        ctx.putImageData(result, 0, 0);
        break;
      }
      case "scanlines": {
        const result = applyScanlines(src, settings.scanlines);
        ctx.putImageData(result, 0, 0);
        break;
      }
    }
  }, [effect, settings, onAsciiText]);

  const scaleSource = useCallback((raw: ImageData, scale: number): { src: ImageData; w: number; h: number } => {
    const w = Math.round(raw.width * scale);
    const h = Math.round(raw.height * scale);
    if (scale === 1) return { src: raw, w, h };

    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = raw.width;
    tmpCanvas.height = raw.height;
    const tmpCtx = tmpCanvas.getContext("2d")!;
    tmpCtx.putImageData(raw, 0, 0);

    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = w;
    scaledCanvas.height = h;
    const scaledCtx = scaledCanvas.getContext("2d")!;
    scaledCtx.drawImage(tmpCanvas, 0, 0, w, h);
    return { src: scaledCtx.getImageData(0, 0, w, h), w, h };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    // Cancel any previous animation loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (matrixRef.current) {
      matrixRef.current.stop();
      matrixRef.current = null;
    }

    const scale = settings.scale;

    if (animated && getFrame && effect !== "matrix-rain") {
      // Animation loop: re-capture frame from source each tick
      const loop = () => {
        const raw = getFrame();
        const { src, w, h } = scaleSource(raw, scale);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        applyEffect(src, ctx, w, h);
        animFrameRef.current = requestAnimationFrame(loop);
      };
      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      // Static render (single image, or matrix-rain which has its own loop)
      const { src, w, h } = scaleSource(imageData, scale);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      applyEffect(src, ctx, w, h);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
      if (matrixRef.current) {
        matrixRef.current.stop();
      }
    };
  }, [imageData, effect, settings, animated, getFrame, canvasRef, applyEffect, scaleSource]);

  return imageData ? (
    <canvas ref={canvasRef} className="max-w-full max-h-full" />
  ) : (
    <p className="text-zinc-600 text-sm">Upload an image to get started</p>
  );
}
