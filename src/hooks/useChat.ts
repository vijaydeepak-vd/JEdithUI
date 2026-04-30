"use client";

import { useState, useEffect, useCallback } from "react";
import { db, generateId, nowISO } from "@/lib/db-client";
import type { DBChat, DBPalette } from "@/lib/db-client";
import type {
  ChatData,
  ChatType,
  Framework,
  UILibrary,
  SlideTheme,
  MessageData,
  CodeVersionData,
  SlideVersionData,
} from "@/types";

/** Convert DB chat + palette into the API-compatible ChatData shape */
async function toApiShape(chat: DBChat): Promise<ChatData> {
  const palette = await db.palettes.get(chat.paletteId);
  const messageCount = await db.messages.where("chatId").equals(chat.id).count();

  // Get latest version
  const latestCode = await db.codeVersions
    .where("chatId")
    .equals(chat.id)
    .reverse()
    .sortBy("version");
  const latestSlide = await db.slideVersions
    .where("chatId")
    .equals(chat.id)
    .reverse()
    .sortBy("version");
  const latestVersion =
    latestCode[0]?.version || latestSlide[0]?.version || 0;

  return {
    id: chat.id,
    name: chat.name,
    type: chat.type as ChatType,
    framework: (chat.framework || null) as Framework | null,
    libraries: chat.libraries as UILibrary[],
    slideTheme: (chat.slideTheme || null) as SlideTheme | null,
    modelName: chat.modelName,
    paletteId: chat.paletteId,
    palette: palette
      ? {
          id: palette.id,
          name: palette.name,
          source: palette.source as any,
          colors: palette.colors,
          createdAt: palette.createdAt,
          updatedAt: palette.updatedAt,
        }
      : ({} as any),
    linkedChatId: chat.linkedChatId || null,
    messageCount,
    latestVersion,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

// ─── useChats: list + create + delete ───────────────

export function useChats(type?: ChatType) {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    let query = db.chats.orderBy("updatedAt").reverse();
    const all = await query.toArray();
    const filtered = type ? all.filter((c) => c.type === type) : all;
    const mapped = await Promise.all(filtered.map(toApiShape));
    setChats(mapped);
    setIsLoading(false);
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const createChat = async (params: {
    name: string;
    type: ChatType;
    framework?: Framework;
    libraries?: UILibrary[];
    slideTheme?: SlideTheme;
    modelName: string;
    paletteId: string;
    linkedChatId?: string;
  }): Promise<ChatData> => {
    const now = nowISO();
    const chat: DBChat = {
      id: generateId(),
      name: params.name,
      type: params.type,
      framework: params.framework,
      libraries: params.libraries || [],
      slideTheme: params.slideTheme,
      modelName: params.modelName,
      paletteId: params.paletteId,
      linkedChatId: params.linkedChatId,
      createdAt: now,
      updatedAt: now,
    };
    await db.chats.add(chat);
    await load();
    return toApiShape(chat);
  };

  const deleteChat = async (id: string) => {
    await db.transaction(
      "rw",
      [db.chats, db.messages, db.codeVersions, db.slideVersions],
      async () => {
        await db.codeVersions.where("chatId").equals(id).delete();
        await db.slideVersions.where("chatId").equals(id).delete();
        await db.messages.where("chatId").equals(id).delete();
        await db.chats.delete(id);
      }
    );
    await load();
  };

  return { chats, isLoading, createChat, deleteChat, refresh: load };
}

// ─── useChatThread: single chat with palette ────────

export function useChatThread(chatId: string | null) {
  const [chat, setChat] = useState<ChatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!chatId) {
      setChat(null);
      setIsLoading(false);
      return;
    }
    const dbChat = await db.chats.get(chatId);
    if (dbChat) {
      const mapped = await toApiShape(dbChat);
      setChat(mapped);
    } else {
      setChat(null);
    }
    setIsLoading(false);
  }, [chatId]);

  useEffect(() => {
    load();
  }, [load]);

  return { chat, isLoading, refresh: load };
}

// ─── useChatMessages: messages for a chat ───────────

export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!chatId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const dbMessages = await db.messages
      .where("chatId")
      .equals(chatId)
      .sortBy("createdAt");

    const enriched: MessageData[] = await Promise.all(
      dbMessages.map(async (msg) => {
        const codeVersion = await db.codeVersions
          .where("messageId")
          .equals(msg.id)
          .first();
        const slideVersion = await db.slideVersions
          .where("messageId")
          .equals(msg.id)
          .first();

        return {
          id: msg.id,
          role: msg.role as "USER" | "ASSISTANT",
          content: msg.content,
          imageBase64: msg.imageBase64,
          hasImage: !!msg.imageBase64,
          codeVersion: codeVersion
            ? {
                id: codeVersion.id,
                code: codeVersion.code,
                language: codeVersion.language,
                version: codeVersion.version,
                modelName: codeVersion.modelName,
                createdAt: codeVersion.createdAt,
              }
            : undefined,
          slideVersion: slideVersion
            ? {
                id: slideVersion.id,
                markdown: slideVersion.markdown,
                slideCount: slideVersion.slideCount,
                version: slideVersion.version,
                modelName: slideVersion.modelName,
                createdAt: slideVersion.createdAt,
              }
            : undefined,
          createdAt: msg.createdAt,
        };
      })
    );

    setMessages(enriched);
    setIsLoading(false);
  }, [chatId]);

  useEffect(() => {
    load();
  }, [load]);

  return { messages, isLoading, refresh: load };
}
