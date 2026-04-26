"use client";

import { useState, useCallback, useRef } from "react";
import type { PaletteColor, Framework, UILibrary } from "@/types";

interface PreviewState {
  html: string | null;
  loading: boolean;
  error: string | null;
}

interface UsePreviewOptions {
  debounceMs?: number;
}

/**
 * Hook that manages fetching a live preview HTML blob from /api/preview.
 * Debounces rapid code changes to avoid hammering the server.
 */
export function usePreview(options: UsePreviewOptions = {}) {
  const { debounceMs = 800 } = options;
  const [state, setState] = useState<PreviewState>({
    html: null,
    loading: false,
    error: null,
  });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPreview = useCallback(
    (
      code: string,
      framework: Framework,
      libraries: UILibrary[],
      palette: PaletteColor[]
    ) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortRef.current) abortRef.current.abort();

      debounceTimer.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        setState((s) => ({ ...s, loading: true, error: null }));

        try {
          const res = await fetch("/api/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, framework, libraries, palette }),
            signal: controller.signal,
          });

          const data = await res.json();

          if (!res.ok || data.error) {
            setState({ html: null, loading: false, error: data.error ?? "Preview failed" });
          } else {
            setState({ html: data.html, loading: false, error: null });
          }
        } catch (e: unknown) {
          if ((e as Error).name === "AbortError") return;
          setState({
            html: null,
            loading: false,
            error: e instanceof Error ? e.message : "Preview request failed",
          });
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  const clearPreview = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (abortRef.current) abortRef.current.abort();
    setState({ html: null, loading: false, error: null });
  }, []);

  return {
    html: state.html,
    loading: state.loading,
    error: state.error,
    fetchPreview,
    clearPreview,
  };
}
