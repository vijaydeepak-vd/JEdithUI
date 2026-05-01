"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { FrameworkSelector } from "@/components/generator/FrameworkSelector";
import { LibrarySelector } from "@/components/generator/LibrarySelector";
import { ModelSelector } from "@/components/generator/ModelSelector";
import { ThemeSelector } from "@/components/generator/ThemeSelector";
import { PromptInput } from "@/components/generator/PromptInput";
import { useChats } from "@/hooks/useChat";
import { useOllamaModels } from "@/hooks/useOllamaModels";
import { getCompatibleLibraries } from "@/lib/ai/library-configs";
import { setPendingAttachments } from "@/lib/pending-attachments";
import type { Framework, UILibrary, AttachedFile } from "@/types";

export default function NewChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPaletteId = searchParams.get("paletteId") || "";

  const { createChat } = useChats("CODE");
  const { defaultModel } = useOllamaModels();

  const [framework, setFramework] = useState<Framework>("REACT");
  const [libraries, setLibraries] = useState<UILibrary[]>(["tailwind"]);
  const [primaryLib, setPrimaryLib] = useState<UILibrary>("tailwind");
  const [model, setModel] = useState("");
  const [paletteId, setPaletteId] = useState(initialPaletteId);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (defaultModel && !model) setModel(defaultModel.name);
  }, [defaultModel, model]);

  // Auto-clean incompatible libraries when framework changes
  useEffect(() => {
    const compatible = getCompatibleLibraries(framework);
    const filtered = libraries.filter((l) => compatible.includes(l));
    // If nothing remains, default to tailwind (universally compatible)
    const next = filtered.length > 0 ? filtered : compatible.includes("tailwind") ? ["tailwind" as UILibrary] : [];
    if (next.length !== libraries.length || next.some((l, i) => l !== libraries[i])) {
      setLibraries(next);
      if (!next.includes(primaryLib) && next.length > 0) {
        setPrimaryLib(next[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framework]);

  const handleStart = async (prompt: string, attachments?: AttachedFile[]) => {
    if (!paletteId || !model) return;
    setCreating(true);
    try {
      // Store attachments in memory — they survive the client-side redirect
      if (attachments && attachments.length > 0) {
        setPendingAttachments(attachments);
      }
      const chat = await createChat({
        name: "Untitled Chat",
        type: "CODE",
        framework,
        libraries,
        modelName: model,
        paletteId,
      });
      // Navigate to chat thread with the first prompt pre-queued
      router.push(`/chat/${chat.id}?firstPrompt=${encodeURIComponent(prompt)}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/chat" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold">New Code Chat</h1>
      </div>

      <div className="space-y-5 bg-card border border-border rounded-xl p-5">
        {/* Palette */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Color Palette *
          </label>
          <div className="mt-2">
            <ThemeSelector value={paletteId} onChange={setPaletteId} />
          </div>
        </section>

        {/* Framework */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Framework
          </label>
          <div className="mt-2">
            <FrameworkSelector value={framework} onChange={setFramework} />
          </div>
        </section>

        {/* Libraries */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            UI Libraries
          </label>
          <div className="mt-2">
            <LibrarySelector
              selected={libraries}
              onChange={setLibraries}
              primary={primaryLib}
              onPrimaryChange={setPrimaryLib}
              framework={framework}
            />
          </div>
        </section>

        {/* Model */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            AI Model
          </label>
          <ModelSelector value={model} onChange={setModel} className="mt-1 w-full" />
        </section>
      </div>

      {/* Prompt input */}
      <div className="space-y-2">
        <p className="text-sm font-medium">What do you want to build?</p>
        {!paletteId && (
          <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
            Select a palette above before generating
          </p>
        )}
        {!model && (
          <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
            Select an AI model above before generating
          </p>
        )}
        <PromptInput
          onSubmit={handleStart}
          loading={creating}
          disabled={!paletteId || !model}
          placeholder="e.g. Create a pricing page with 3 tiers using the brand colors"
        />
      </div>

      {creating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Creating chat and generating…
        </div>
      )}
    </div>
  );
}
