"use client";

import { ChevronDown } from "lucide-react";
import { useOllamaModels } from "@/hooks/useOllamaModels";
import { cn } from "@/lib/utils";

interface InlineModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
}

const BADGE_ICON: Record<string, string> = {
  recommended: "\u2B50",
  vision: "\uD83D\uDDBC\uFE0F",
  code: "\uD83D\uDCBB",
  large: "\uD83E\uDDE0",
};

/**
 * Compact inline model selector for use in chat headers.
 * Shows current model as a clickable dropdown — no label, minimal footprint.
 */
export function InlineModelSelector({
  value,
  onChange,
  disabled = false,
  className,
}: InlineModelSelectorProps) {
  const { models, status } = useOllamaModels();

  if (!status.connected || models.length === 0) {
    return (
      <span className={cn("text-[11px] text-muted-foreground", className)}>
        {value}
      </span>
    );
  }

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none bg-transparent text-[11px] text-jedith-copper font-medium pr-4 cursor-pointer hover:text-jedith-copper/80 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {models.map((model) => {
          const badges = model.badges
            .map((b) => BADGE_ICON[b])
            .filter(Boolean)
            .join(" ");
          return (
            <option key={model.name} value={model.name}>
              {badges ? `${badges} ` : ""}{model.name} · {model.sizeLabel}
            </option>
          );
        })}
      </select>
      <ChevronDown className="w-3 h-3 text-jedith-copper/60 absolute right-0 pointer-events-none" />
    </span>
  );
}
