"use client";

import Link from "next/link";
import { Plus, Presentation } from "lucide-react";
import { useChats } from "@/hooks/useChat";
import { timeAgo } from "@/lib/utils";

export default function PresentationsPage() {
  const { chats, isLoading, deleteChat } = useChats("PRESENTATION");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Presentations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated slide decks using your brand palette · Powered by Marp
          </p>
        </div>
        <Link
          href="/presentations/new"
          className="flex items-center gap-2 px-4 py-2 bg-jedith-forest text-white rounded-lg text-sm font-medium hover:bg-jedith-forest-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Presentation
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="text-5xl">📊</div>
          <p className="text-lg font-semibold">No presentations yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Generate branded slide decks from your palettes. Same chat pattern as code generation.
          </p>
          <Link
            href="/presentations/new"
            className="px-4 py-2 bg-jedith-forest text-white rounded-lg text-sm font-medium"
          >
            Create First Presentation
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-jedith-forest/50 hover:bg-muted/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-jedith-copper/10 flex items-center justify-center flex-shrink-0">
                <Presentation className="w-5 h-5 text-jedith-copper" />
              </div>

              <Link href={`/presentations/${chat.id}`} className="flex-1 min-w-0">
                <p className="font-medium text-foreground group-hover:text-jedith-forest transition-colors truncate">
                  {chat.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {chat.messageCount} messages · {chat.slideTheme} theme · {chat.modelName}
                </p>
              </Link>

              {chat.palette?.colors && (
                <div className="hidden sm:flex gap-1">
                  {chat.palette.colors.slice(0, 4).map((c, i) => (
                    <div
                      key={`${c.role}-${i}`}
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: c.hex }}
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
