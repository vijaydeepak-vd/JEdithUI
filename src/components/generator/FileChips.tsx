"use client";

import { X } from "lucide-react";
import { formatFileSize, getFileIcon } from "@/lib/file-reader";
import type { AttachedFile } from "@/types";

interface FileChipsProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}

export function FileChips({ files, onRemove }: FileChipsProps) {
  if (files.length === 0) return null;

  const images = files.filter((f) => f.category === "image");
  const others = files.filter((f) => f.category !== "image");

  return (
    <div className="flex flex-wrap gap-2">
      {/* Image thumbnails */}
      {images.map((file) => (
        <div key={file.id} className="relative inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:${file.mimeType};base64,${file.base64}`}
            alt={file.name}
            className="h-16 max-w-[120px] object-cover rounded-lg border border-border"
          />
          <RemoveButton onClick={() => onRemove(file.id)} />
        </div>
      ))}

      {/* Non-image file chips */}
      {others.map((file) => (
        <div
          key={file.id}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-xs max-w-[200px]"
        >
          <span className="flex-shrink-0">{getFileIcon(file)}</span>
          <span className="truncate font-medium text-foreground">{file.name}</span>
          <span className="flex-shrink-0 text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
          <RemoveButton onClick={() => onRemove(file.id)} />
        </div>
      ))}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-red-600 transition-colors"
    >
      <X className="w-2.5 h-2.5" />
    </button>
  );
}
