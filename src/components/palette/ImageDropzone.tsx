"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  onImageSelect: (base64: string, file: File) => void;
  disabled?: boolean;
}

export function ImageDropzone({ onImageSelect, disabled }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Strip data URI prefix → pure base64
        const base64 = dataUrl.split(",")[1];
        setPreview(dataUrl);
        onImageSelect(base64, file);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    maxFiles: 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-xl transition-colors cursor-pointer",
        isDragActive
          ? "border-jedith-copper bg-jedith-copper/5"
          : "border-border hover:border-jedith-forest/50 hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
            <p className="text-white text-sm font-medium">Click to change</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          {isDragActive ? (
            <>
              <ImageIcon className="w-10 h-10 text-jedith-copper" />
              <p className="text-sm font-medium text-jedith-copper">Drop it!</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drop a screenshot here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse · PNG, JPG, WebP
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
