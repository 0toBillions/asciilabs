"use client";

import { useState, useCallback } from "react";

interface ExportPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  asciiText: string;
  effect: string;
}

export default function ExportPanel({ canvasRef, asciiText, effect }: ExportPanelProps) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("png");

  const doExport = useCallback((format: string) => {
    setSelected(format);

    if (format === "txt") {
      if (!asciiText) return;
      const blob = new Blob([asciiText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asciilabs-ascii.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const mimeMap: Record<string, string> = {
      png: "image/png",
      jpeg: "image/jpeg",
    };
    const mime = mimeMap[format];
    if (!mime) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asciilabs-${effect}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }, mime);
  }, [canvasRef, asciiText, effect]);

  const formats = [
    { id: "png", label: "PNG", ext: ".png" },
    { id: "jpeg", label: "JPEG", ext: ".jpg" },
    ...(effect === "ascii" ? [{ id: "txt", label: "Text", ext: ".txt" }] : []),
  ];

  return (
    <div className="border-t border-zinc-800/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 w-full text-left py-2.5 px-4"
      >
        <span className="text-zinc-500">{open ? "−" : "+"}</span>
        <span>Export</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <span className="text-xs text-zinc-500">Format</span>
          <div className="grid grid-cols-2 gap-0 border border-zinc-700/50 rounded overflow-hidden">
            {formats.map((f) => (
              <button
                key={f.id}
                onClick={() => doExport(f.id)}
                className={`
                  px-3 py-2 text-left border-b border-r border-zinc-700/50 last:border-r-0
                  transition-colors
                  ${selected === f.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800/50"
                  }
                `}
              >
                <div className="text-xs font-medium">{f.label}</div>
                <div className="text-[10px] text-zinc-600">{f.ext}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
