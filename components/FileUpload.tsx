"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  onFileLoaded: (file: File) => void;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

export default function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (ACCEPTED_TYPES.includes(file.type)) {
        onFileLoaded(file);
      }
    },
    [onFileLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onClickBrowse = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_TYPES.join(",");
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClickBrowse}
      className={`
        border border-dashed rounded px-3 py-3 text-center cursor-pointer
        transition-colors duration-150
        ${dragOver ? "border-green-500/50 bg-green-500/5" : "border-zinc-700/50 hover:border-zinc-600"}
      `}
    >
      <p className="text-xs text-zinc-500">Drop file or click to browse</p>
      <p className="text-xs text-zinc-600 mt-0.5">PNG, JPG, GIF, MP4, WebM</p>
    </div>
  );
}
