"use client";

import { useOllamaModels } from "@/hooks/useOllamaModels";
import { cn } from "@/lib/utils";

export function OllamaStatus() {
  const { status, models, isLoading } = useOllamaModels();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span>Checking connection…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          status.connected ? "bg-green-500" : "bg-red-500"
        )}
      />
      {status.connected ? (
        <span className="text-muted-foreground">
          Connected · {models.length} model{models.length !== 1 ? "s" : ""} · {status.defaultModel}
        </span>
      ) : (
        <span className="text-destructive">
          AI service unavailable
        </span>
      )}
    </div>
  );
}
