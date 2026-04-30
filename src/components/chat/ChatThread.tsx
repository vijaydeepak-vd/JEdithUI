"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { PromptInput } from "@/components/generator/PromptInput";
import { VersionTimeline } from "./VersionTimeline";
import type { MessageData, ChatData, PaletteColor, Framework, UILibrary, AttachedFile } from "@/types";

interface ChatThreadProps {
  chat: ChatData;
  messages: MessageData[];
  onSendMessage: (prompt: string, attachments?: AttachedFile[]) => Promise<void>;
  generating?: boolean;
}

export function ChatThread({
  chat,
  messages,
  onSendMessage,
  generating = false,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const palette = (chat.palette?.colors || []) as PaletteColor[];
  const framework = (chat.framework || "REACT") as Framework;
  const libraries = (chat.libraries || []) as UILibrary[];

  // Collect all code versions for the timeline
  const allVersions = messages
    .filter((m) => m.codeVersion)
    .map((m) => ({
      version: m.codeVersion!.version,
      modelName: m.codeVersion!.modelName,
      createdAt: m.codeVersion!.createdAt,
    }));

  const latestVersion = allVersions[allVersions.length - 1]?.version ?? 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFixError = (errorMsg: string) => {
    onSendMessage(
      `The preview shows this error: ${errorMsg}. Please fix the code so it renders correctly.`
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
            <span className="text-4xl">✨</span>
            <p className="text-sm font-medium">Start by describing what you want to build</p>
            <p className="text-xs">Your first message creates v1 of the component</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              framework={framework}
              libraries={libraries}
              palette={palette}
              allVersions={allVersions}
              onFixError={handleFixError}
            />
          ))
        )}

        {generating && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-jedith-forest flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              J
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-copper animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-copper animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-copper animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <PromptInput
          onSubmit={onSendMessage}
          loading={generating}
          placeholder={
            messages.length === 0
              ? "Describe the UI you want to generate…"
              : "Refine the code — e.g. 'Add a dark mode toggle'"
          }
        />
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          {chat.modelName} · {framework} · {libraries.join(", ") || "Tailwind"}
        </p>
      </div>
    </div>
  );
}
