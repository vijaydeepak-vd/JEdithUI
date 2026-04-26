"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { getOrCreateSessionId } from "@/lib/utils";
import type { ChatData, ChatType, Framework, UILibrary, SlideTheme } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useChats(type?: ChatType) {
  // null on server + first client render → avoids SSR/hydration mismatch
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const url = sessionId
    ? `/api/chat?sessionId=${sessionId}${type ? `&type=${type}` : ""}`
    : null;

  const { data, isLoading, mutate } = useSWR<{ chats: ChatData[] }>(url, fetcher);
  const chats = data?.chats || [];

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
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, sessionId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create chat");
    await mutate();
    return json.chat;
  };

  const deleteChat = async (id: string) => {
    await fetch(`/api/chat/${id}`, { method: "DELETE" });
    await mutate();
  };

  return { chats, isLoading, createChat, deleteChat, refresh: mutate };
}

export function useChatThread(chatId: string | null) {
  const { data, isLoading, mutate } = useSWR(
    chatId ? `/api/chat/${chatId}` : null,
    fetcher
  );

  return {
    chat: data?.chat || null,
    isLoading,
    refresh: mutate,
  };
}
