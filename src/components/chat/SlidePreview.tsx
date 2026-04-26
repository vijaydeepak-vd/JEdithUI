"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { PaletteColor, SlideTheme } from "@/types";

interface SlidePreviewProps {
  markdown: string;
  palette: PaletteColor[];
  theme?: SlideTheme;
  currentSlide?: number;
  className?: string;
}

export function SlidePreview({
  markdown,
  palette,
  theme = "default",
  currentSlide = 0,
  className,
}: SlidePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Fetch rendered HTML from preview API
  useEffect(() => {
    if (!markdown) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setIframeReady(false);

    fetch("/api/presentation/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, palette, theme }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setHtml(data.html);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Preview failed");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [markdown, palette, theme]);

  // Write HTML into iframe
  useEffect(() => {
    if (html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        // Small delay to let the iframe script initialize
        const timer = setTimeout(() => setIframeReady(true), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [html]);

  // Listen for messages from iframe (e.g. slideCount)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "slideCount") {
        // Could use this to sync slide count if needed
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Navigate to current slide via postMessage
  const goToSlide = useCallback(
    (index: number) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "goToSlide", index },
          "*"
        );
      }
    },
    []
  );

  // Send goToSlide whenever currentSlide changes and iframe is ready
  useEffect(() => {
    if (iframeReady) {
      goToSlide(currentSlide);
    }
  }, [currentSlide, iframeReady, goToSlide]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border bg-muted/30 ${className ?? ""}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-muted/60">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Rendering slides…
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-destructive/5 p-4 gap-3">
          <AlertCircle className="w-6 h-6 text-destructive" />
          <p className="text-sm text-destructive text-center">{error}</p>
          <button
            onClick={() => setLoading(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs hover:bg-muted/80 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        className={`w-full transition-opacity duration-200 ${loading || error ? "opacity-0" : "opacity-100"}`}
        style={{ height: "480px", border: "none" }}
        sandbox="allow-scripts allow-same-origin"
        title="Slide Preview"
      />
    </div>
  );
}
