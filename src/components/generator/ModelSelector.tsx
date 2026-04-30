"use client";

import { useOllamaModels } from "@/hooks/useOllamaModels";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import type { OllamaModelWithBadges } from "@/types";

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  visionOnly?: boolean;
  className?: string;
}

const BADGE_ICON: Record<string, string> = {
  recommended: "⭐",
  vision: "🖼️",
  code: "💻",
  large: "🧠",
};

export function ModelSelector({ value, onChange, visionOnly = false, className }: ModelSelectorProps) {
  const { models, visionModels, status, isLoading } = useOllamaModels();

  const displayModels = visionOnly ? visionModels : models;

  if (!status.connected) {
    return (
      <div className={cn("px-3 py-2 rounded-lg border border-destructive/50 bg-destructive/5 text-sm text-destructive", className)}>
        Ollama not connected
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("px-3 py-2 rounded-lg border border-border bg-muted animate-pulse text-sm text-muted-foreground", className)}>
        Loading models…
      </div>
    );
  }

  if (displayModels.length === 0) {
    return (
      <div className={cn("px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground", className)}>
        {visionOnly ? "No vision models — run ollama pull gemma4:e4b" : "No models installed"}
      </div>
    );
  }

  return (
    <select
      value={value || displayModels[0]?.name}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-jedith-copper/50",
        className
      )}
    >
      {displayModels.map((model) => (
        <ModelOption key={model.name} model={model} />
      ))}
    </select>
  );
}

function ModelOption({ model }: { model: OllamaModelWithBadges }) {
  const badgeIcons = model.badges.map((b) => BADGE_ICON[b]).filter(Boolean).join(" ");
  const sizeStr = model.sizeLabel ? `${model.sizeLabel}` : formatBytes(model.size);

  return (
    <option value={model.name}>
      {badgeIcons} {model.name} · {sizeStr}
    </option>
  );
}
