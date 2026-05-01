"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaletteEditor } from "@/components/palette/PaletteEditor";
import { ImageDropzone } from "@/components/palette/ImageDropzone";
import { ModelSelector } from "@/components/generator/ModelSelector";
import { ColorSwatch } from "@/components/palette/ColorSwatch";
import { usePalettes } from "@/hooks/usePalettes";
import { useOllamaModels } from "@/hooks/useOllamaModels";
import type { PaletteColor, PaletteSource } from "@/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPalettePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "manual";

  const { createPalette } = usePalettes();
  const { defaultModel, visionModels } = useOllamaModels();

  const [activeTab, setActiveTab] = useState(initialMode);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedColors, setExtractedColors] = useState<PaletteColor[]>([]);
  const [selectedModel, setSelectedModel] = useState(defaultModel?.name || "");
  const [cssText, setCssText] = useState("");
  const [parsingCss, setParsingCss] = useState(false);
  const [cssColors, setCssColors] = useState<PaletteColor[]>([]);
  const [paletteName, setPaletteName] = useState("");

  useEffect(() => {
    if (defaultModel && !selectedModel) setSelectedModel(defaultModel.name);
  }, [defaultModel, selectedModel]);

  const handleSave = async (name: string, colors: PaletteColor[]) => {
    setSaving(true);
    try {
      const sourceMap: Record<string, PaletteSource> = {
        manual: "MANUAL",
        image: "IMAGE",
        css: "CSS",
      };
      const palette = await createPalette(name, sourceMap[activeTab] || "MANUAL", colors);
      router.push(`/palettes/${palette.id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = async (base64: string) => {
    if (!selectedModel) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/extract-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, model: selectedModel }),
      });
      const data = await res.json();
      if (data.colors) setExtractedColors(data.colors);
    } catch (e) {
      console.error("Extraction failed:", e);
    } finally {
      setExtracting(false);
    }
  };

  const handleParseCss = async () => {
    if (!cssText.trim()) return;
    setParsingCss(true);
    try {
      const res = await fetch("/api/parse-css", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ css: cssText }),
      });
      const data = await res.json();
      if (data.colors) setCssColors(data.colors);
    } finally {
      setParsingCss(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/palettes" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold">New Palette</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="image">From Screenshot</TabsTrigger>
          <TabsTrigger value="css">From CSS</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <PaletteEditor onSave={handleSave} saving={saving} />
        </TabsContent>

        <TabsContent value="image" className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Vision Model
            </label>
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              visionOnly
              className="mt-1 w-full"
            />
          </div>

          <ImageDropzone onImageSelect={handleImageSelect} disabled={!selectedModel} />

          {extracting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting colors with AI…
            </div>
          )}

          {extractedColors.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {extractedColors.map((c, i) => (
                  <ColorSwatch key={`${c.hex}-${c.role}-${i}`} color={c} size="lg" />
                ))}
              </div>
              <PaletteEditor
                initialColors={extractedColors}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="css" className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Paste CSS
            </label>
            <textarea
              value={cssText}
              onChange={(e) => setCssText(e.target.value)}
              rows={10}
              placeholder=":root {\n  --primary: #344620;\n  --accent: #d57a2a;\n}"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-jedith-copper/50"
            />
            <button
              onClick={handleParseCss}
              disabled={!cssText.trim() || parsingCss}
              className="mt-2 px-4 py-2 bg-jedith-forest text-white rounded-lg text-sm font-medium hover:bg-jedith-forest-light disabled:opacity-50 transition-colors"
            >
              {parsingCss ? "Parsing…" : "Parse Colors"}
            </button>
          </div>

          {cssColors.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {cssColors.map((c, i) => <ColorSwatch key={`${c.hex}-${c.role}-${i}`} color={c} size="lg" />)}
              </div>
              <PaletteEditor initialColors={cssColors} onSave={handleSave} saving={saving} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
