"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Sparkles, X } from "lucide-react";

interface SkillNameModalProps {
  open: boolean;
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function SkillNameModal({
  open,
  defaultName,
  onConfirm,
  onCancel,
}: SkillNameModalProps) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset & focus when modal opens
  useEffect(() => {
    if (open) {
      setName(defaultName);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, defaultName]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) {
      onConfirm(name.trim());
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Export Claude Skill</h2>
            <p className="text-xs text-muted-foreground">
              Name your skill — this will be the folder and skill identifier
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Skill Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. dashboard-theme"
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          />
          <p className="text-[11px] text-muted-foreground">
            The ZIP and skill folder will use this name exactly as you type it.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Download Skill
          </button>
        </div>
      </div>
    </div>
  );
}
