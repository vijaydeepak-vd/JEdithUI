"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Send, Loader2, Paperclip } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { readFile, ACCEPTED_FILE_TYPES } from "@/lib/file-reader";
import { FileChips } from "./FileChips";
import type { AttachedFile } from "@/types";

interface PromptInputProps {
  onSubmit: (prompt: string, attachments?: AttachedFile[]) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

const MAX_FILES = 10;

export function PromptInput({
  onSubmit,
  loading = false,
  placeholder = "Describe the UI you want to generate\u2026",
  className,
}: PromptInputProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [reading, setReading] = useState(false);
  const [readProgress, setReadProgress] = useState({ done: 0, total: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasAttachments = attachments.length > 0;
  const hasImage = attachments.some((f) => f.category === "image");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if ((!trimmed && !hasAttachments) || loading || reading) return;
    const prompt = trimmed || (hasImage ? "Generate a UI component matching this screenshot" : "");
    if (!prompt) return;
    onSubmit(prompt, hasAttachments ? attachments : undefined);
    setValue("");
    setAttachments([]);
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

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      const remaining = MAX_FILES - attachments.length;
      const toProcess = accepted.slice(0, remaining);
      if (toProcess.length === 0) return;

      setReading(true);
      setReadProgress({ done: 0, total: toProcess.length });

      try {
        const results: AttachedFile[] = [];
        for (let i = 0; i < toProcess.length; i++) {
          const result = await readFile(toProcess[i]);
          results.push(result);
          setReadProgress({ done: i + 1, total: toProcess.length });
        }
        setAttachments((prev) => [...prev, ...results]);
      } finally {
        setReading(false);
        setReadProgress({ done: 0, total: 0 });
      }
    },
    [attachments.length]
  );

  const removeFile = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: MAX_FILES,
    noClick: true,
    noKeyboard: true,
    disabled: loading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col gap-2 p-3 bg-card border rounded-xl shadow-sm transition-colors",
        isDragActive
          ? "border-jedith-copper bg-jedith-copper/5 ring-2 ring-jedith-copper/20"
          : "border-border",
        className
      )}
    >
      <input {...getInputProps()} />

      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-jedith-copper/10 border-2 border-dashed border-jedith-copper pointer-events-none">
          <p className="text-sm font-medium text-jedith-copper">
            Drop files here
          </p>
        </div>
      )}

      {/* Upload progress bar */}
      {reading && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-jedith-copper rounded-full transition-all duration-300 ease-out"
              style={{
                width: readProgress.total > 0
                  ? `${(readProgress.done / readProgress.total) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground flex-shrink-0 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Reading {readProgress.done}/{readProgress.total} files
          </span>
        </div>
      )}

      {/* Attached file chips */}
      {hasAttachments && !reading && (
        <FileChips files={attachments} onRemove={removeFile} />
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          onClick={openFilePicker}
          disabled={loading || reading}
          title="Attach files (images, documents, code, data)"
          className="flex-shrink-0 w-8 h-8 rounded-lg border border-border text-muted-foreground flex items-center justify-center hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {reading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={
            hasImage
              ? "Describe what to generate from the screenshot\u2026"
              : placeholder
          }
          rows={1}
          disabled={loading}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[24px] max-h-40 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={(!value.trim() && !hasAttachments) || loading || reading}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-jedith-forest text-white flex items-center justify-center hover:bg-jedith-forest-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
