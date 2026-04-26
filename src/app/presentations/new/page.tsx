"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { SlideThemeSelector } from "@/components/generator/SlideThemeSelector";
import { ThemeSelector } from "@/components/generator/ThemeSelector";
import { ModelSelector } from "@/components/generator/ModelSelector";
import { PromptInput } from "@/components/generator/PromptInput";
import { useChats } from "@/hooks/useChat";
import { useOllamaModels } from "@/hooks/useOllamaModels";
import { usePalettes } from "@/hooks/usePalettes";
import type { SlideTheme } from "@/types";

export default function NewPresentationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPaletteId = searchParams.get("paletteId") || "";

  const { createChat } = useChats("PRESENTATION");
  const { defaultModel } = useOllamaModels();
  const { palettes } = usePalettes();

  const [name, setName] = useState("");
  const [slideTheme, setSlideTheme] = useState<SlideTheme>("business");
  const [model, setModel] = useState("");
  const [paletteId, setPaletteId] = useState(initialPaletteId);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (defaultModel && !model) setModel(defaultModel.name);
  }, [defaultModel, model]);

  const selectedPalette = palettes.find((p) => p.id === paletteId);

  const handleStart = async (prompt: string) => {
    if (!paletteId || !model) return;
    setCreating(true);
    try {
      const chat = await createChat({
        name: name.trim() || "Untitled Presentation",
        type: "PRESENTATION",
        slideTheme,
        modelName: model,
        paletteId,
      });
      router.push(`/presentations/${chat.id}?firstPrompt=${encodeURIComponent(prompt)}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/presentations" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold">New Presentation</h1>
      </div>

      <div className="space-y-5 bg-card border border-border rounded-xl p-5">
        {/* Presentation Name */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Presentation Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 Analytics Pitch Deck"
            className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-jedith-coral/40 focus:border-jedith-coral transition-colors"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Leave blank to auto-generate from your first prompt
          </p>
        </section>

        {/* Palette */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Color Palette *
          </label>
          <div className="mt-2">
            <ThemeSelector value={paletteId} onChange={setPaletteId} />
          </div>
        </section>

        {/* Slide Theme */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Slide Theme
          </label>
          <div className="mt-2">
            <SlideThemeSelector
              value={slideTheme}
              onChange={setSlideTheme}
              palette={selectedPalette?.colors}
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

      {/* Prompt */}
      <div className="space-y-2">
        <p className="text-sm font-medium">What presentation do you need?</p>
        {!paletteId && (
          <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
            Select a palette above before generating
          </p>
        )}
        <PromptInput
          onSubmit={handleStart}
          loading={creating}
          placeholder="e.g. 5-slide pitch deck for our analytics dashboard covering: problem, solution, demo, pricing, CTA"
        />
      </div>

      {creating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Creating presentation and generating slides…
        </div>
      )}
    </div>
  );
}
