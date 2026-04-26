"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { getOrCreateSessionId } from "@/lib/utils";
import type { PaletteData, PaletteColor, PaletteSource } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePalettes() {
  // null on server + first client render → avoids SSR/hydration mismatch
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const { data, isLoading, mutate } = useSWR<{ palettes: PaletteData[] }>(
    sessionId ? `/api/palettes?sessionId=${sessionId}` : null,
    fetcher
  );

  const palettes = data?.palettes || [];

  const createPalette = async (
    name: string,
    source: PaletteSource,
    colors: PaletteColor[]
  ): Promise<PaletteData> => {
    const res = await fetch("/api/palettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, source, colors, sessionId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create palette");
    await mutate();
    return json.palette;
  };

  const updatePalette = async (
    id: string,
    updates: { name?: string; colors?: PaletteColor[] }
  ): Promise<void> => {
    await fetch(`/api/palettes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await mutate();
  };

  const deletePalette = async (id: string): Promise<void> => {
    await fetch(`/api/palettes/${id}`, { method: "DELETE" });
    await mutate();
  };

  return { palettes, isLoading, createPalette, updatePalette, deletePalette, refresh: mutate };
}
