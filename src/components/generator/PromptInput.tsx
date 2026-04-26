"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Send, Loader2, Image as ImageIcon, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onSubmit: (prompt: string, imageBase64?: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
  enableImageUpload?: boolean;
}

export function PromptInput({
  onSubmit,
  loading = false,
  placeholder = "Describe the UI you want to generate…",
  className,
  enableImageUpload = false,
}: PromptInputProps) {
  const [value, setValue] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if ((!trimmed && !imageBase64) || loading) return;
    onSubmit(trimmed || "Generate a UI component matching this screenshot", imageBase64 || undefined);
    setValue("");
    setImageBase64(null);
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setImagePreview(dataUrl);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, open: openFilePicker } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    disabled: loading || !enableImageUpload,
  });

  const removeImage = () => {
    setImageBase64(null);
    setImagePreview(null);
  };

  return (
    <div
      {...(enableImageUpload ? getRootProps() : {})}
      className={cn(
        "relative flex flex-col gap-2 p-3 bg-card border border-border rounded-xl shadow-sm",
        className
      )}
    >
      {enableImageUpload && <input {...getInputProps()} />}

      {/* Image preview thumbnail */}
      {imagePreview && (
        <div className="relative inline-flex w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Attached screenshot"
            className="h-20 max-w-[200px] object-cover rounded-lg border border-border"
          />
          <button
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Image upload button */}
        {enableImageUpload && (
          <button
            onClick={openFilePicker}
            disabled={loading}
            title="Attach a screenshot"
            className="flex-shrink-0 w-8 h-8 rounded-lg border border-border text-muted-foreground flex items-center justify-center hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={imageBase64 ? "Describe what to generate from the screenshot…" : placeholder}
          rows={1}
          disabled={loading}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[24px] max-h-40 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={(!value.trim() && !imageBase64) || loading}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-jedith-navy text-white flex items-center justify-center hover:bg-jedith-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
