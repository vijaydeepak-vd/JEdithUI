"use client";

import Link from "next/link";
import { Plus, Code2 } from "lucide-react";
import { useChats } from "@/hooks/useChat";
import { timeAgo } from "@/lib/utils";

export default function ChatListPage() {
  const { chats, isLoading, deleteChat } = useChats("CODE");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Code Chats</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conversational UI generation — every session is a persistent chat
          </p>
        </div>
        <Link
          href="/chat/new"
          className="flex items-center gap-2 px-4 py-2 bg-jedith-forest text-white rounded-lg text-sm font-medium hover:bg-jedith-forest-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="text-5xl">💬</div>
          <p className="text-lg font-semibold">No chats yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Start a conversation to generate themed UI components. Pick a palette and describe what you want.
          </p>
          <Link
            href="/chat/new"
            className="px-4 py-2 bg-jedith-forest text-white rounded-lg text-sm font-medium hover:bg-jedith-forest-light transition-colors"
          >
            Start First Chat
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-jedith-forest/50 hover:bg-muted/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-jedith-forest/10 flex items-center justify-center flex-shrink-0">
                <Code2 className="w-5 h-5 text-jedith-forest" />
              </div>

              <Link href={`/chat/${chat.id}`} className="flex-1 min-w-0">
                <p className="font-medium text-foreground group-hover:text-jedith-forest transition-colors truncate">
                  {chat.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {chat.messageCount} messages · v{chat.latestVersion} · {chat.framework} · {chat.modelName}
                </p>
              </Link>

              {/* Palette mini swatches */}
              {chat.palette?.colors && (
                <div className="hidden sm:flex gap-1">
                  {chat.palette.colors.slice(0, 4).map((c, i) => (
                    <div
                      key={`${c.role}-${i}`}
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: c.hex }}
                      title={c.role}
                    />
                  ))}
                </div>
              )}

              <span className="text-xs text-muted-foreground flex-shrink-0">
                {timeAgo(chat.updatedAt)}
              </span>

              <button
                onClick={() => deleteChat(chat.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive transition-all px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
