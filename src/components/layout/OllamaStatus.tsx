"use client";

import { useOllamaModels } from "@/hooks/useOllamaModels";
import { cn } from "@/lib/utils";

export function OllamaStatus() {
  const { status, models, isLoading } = useOllamaModels();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span>Connecting to Ollama…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          status.connected
            ? models.length > 0
              ? "bg-green-500"
              : "bg-yellow-400"
            : "bg-red-500"
        )}
      />
      {status.connected ? (
        <span className="text-muted-foreground">
          Ollama connected ·{" "}
          {models.length > 0
            ? `${models.length} model${models.length > 1 ? "s" : ""} · ${status.defaultModel}`
            : "no models — run ollama pull"}
        </span>
      ) : (
        <span className="text-destructive">
          Ollama disconnected — run{" "}
          <code className="font-mono bg-muted px-1 rounded">ollama serve</code>
        </span>
      )}
    </div>
  );
}
