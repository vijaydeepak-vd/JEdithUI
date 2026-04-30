"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Framework, UILibrary, PaletteColor } from "@/types";

interface CodePreviewProps {
  code: string;
  framework: Framework;
  libraries: UILibrary[];
  palette: PaletteColor[];
  onFixError?: (errorMsg: string) => void;
}

export function CodePreview({
  code,
  framework,
  libraries,
  palette,
  onFixError,
}: CodePreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    buildPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const buildPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, framework, libraries, palette }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setHtml(data.html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  if (!code) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          Live Preview · {framework}
        </span>
        <button
          onClick={buildPreview}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh preview"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Preview area */}
      <div className="relative flex-1 min-h-[300px] bg-white rounded-b-xl">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 rounded-b-xl">
            <RefreshCw className="w-5 h-5 animate-spin text-jedith-forest" />
          </div>
        )}

        {error ? (
          <div className="p-4">
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-400">Preview error</p>
                <p className="text-red-400/80 text-xs mt-1 font-mono">{error}</p>
                {onFixError && (
                  <button
                    onClick={() => onFixError(error)}
                    className="mt-2 text-xs text-jedith-copper underline hover:no-underline"
                  >
                    Ask AI to fix this error
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : html ? (
          <iframe
            srcDoc={html}
            sandbox="allow-scripts allow-same-origin"
            className="w-full border-0 rounded-b-xl"
            style={{ height: "100%", minHeight: "400px" }}
            title="Component preview"
          />
        ) : null}
      </div>
    </div>
  );
}
