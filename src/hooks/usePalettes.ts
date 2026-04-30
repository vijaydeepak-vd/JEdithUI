"use client";

import { useState, useEffect, useCallback } from "react";
import { db, generateId, nowISO } from "@/lib/db-client";
import type { DBPalette, DBColor } from "@/lib/db-client";
import type { PaletteData, PaletteColor, PaletteSource } from "@/types";

/** Convert DB palette to API-compatible shape */
function toApiShape(p: DBPalette): PaletteData {
  return {
    id: p.id,
    name: p.name,
    source: p.source as PaletteSource,
    colors: p.colors as PaletteColor[],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function usePalettes() {
  const [palettes, setPalettes] = useState<PaletteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const all = await db.palettes.orderBy("updatedAt").reverse().toArray();
    setPalettes(all.map(toApiShape));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPalette = async (
    name: string,
    source: PaletteSource,
    colors: PaletteColor[]
  ): Promise<PaletteData> => {
    const now = nowISO();
    const palette: DBPalette = {
      id: generateId(),
      name,
      source,
      colors: colors.map((c) => ({ hex: c.hex, role: c.role, order: c.order })),
      createdAt: now,
      updatedAt: now,
    };
    await db.palettes.add(palette);
    await load();
    return toApiShape(palette);
  };

  const updatePalette = async (
    id: string,
    updates: { name?: string; colors?: PaletteColor[] }
  ): Promise<void> => {
    const existing = await db.palettes.get(id);
    if (!existing) return;

    const data: Partial<DBPalette> = { updatedAt: nowISO() };
    if (updates.name) data.name = updates.name;
    if (updates.colors) {
      data.colors = updates.colors.map((c) => ({
        hex: c.hex,
        role: c.role,
        order: c.order,
      }));
    }
    await db.palettes.update(id, data);
    await load();
  };

  const deletePalette = async (id: string): Promise<void> => {
    // Also delete all chats using this palette and their messages
    const chats = await db.chats.where("paletteId").equals(id).toArray();
    const chatIds = chats.map((c) => c.id);

    await db.transaction("rw", [db.palettes, db.chats, db.messages, db.codeVersions, db.slideVersions], async () => {
      for (const chatId of chatIds) {
        await db.codeVersions.where("chatId").equals(chatId).delete();
        await db.slideVersions.where("chatId").equals(chatId).delete();
        await db.messages.where("chatId").equals(chatId).delete();
      }
      await db.chats.where("paletteId").equals(id).delete();
      await db.palettes.delete(id);
    });
    await load();
  };

  return { palettes, isLoading, createPalette, updatePalette, deletePalette, refresh: load };
}
