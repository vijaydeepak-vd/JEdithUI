"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Image, Code2, FileText } from "lucide-react";
import { PaletteCard } from "@/components/palette/PaletteCard";
import { usePalettes } from "@/hooks/usePalettes";
import type { PaletteData } from "@/types";

export default function PalettesPage() {
  const router = useRouter();
  const { palettes, deletePalette, isLoading } = usePalettes();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Palettes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your color palettes — create from scratch, images, or CSS
          </p>
        </div>
        <Link
          href="/palettes/new"
          className="flex items-center gap-2 px-4 py-2 bg-jedith-navy text-white rounded-lg text-sm font-medium hover:bg-jedith-navy-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Palette
        </Link>
      </div>

      {/* Quick create cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/palettes/new?mode=manual"
          className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-jedith-navy hover:bg-muted/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-jedith-navy/10 flex items-center justify-center group-hover:bg-jedith-navy/20">
            <Plus className="w-5 h-5 text-jedith-navy" />
          </div>
          <div>
            <p className="text-sm font-medium">Manual</p>
            <p className="text-xs text-muted-foreground">Build from color pickers</p>
          </div>
        </Link>

        <Link
          href="/palettes/new?mode=image"
          className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-jedith-coral hover:bg-muted/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-jedith-coral/10 flex items-center justify-center group-hover:bg-jedith-coral/20">
            <Image className="w-5 h-5 text-jedith-coral" />
          </div>
          <div>
            <p className="text-sm font-medium">From Screenshot</p>
            <p className="text-xs text-muted-foreground">AI extracts colors via vision</p>
          </div>
        </Link>

        <Link
          href="/palettes/new?mode=css"
          className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-jedith-navy hover:bg-muted/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-jedith-navy/10 flex items-center justify-center group-hover:bg-jedith-navy/20">
            <FileText className="w-5 h-5 text-jedith-navy" />
          </div>
          <div>
            <p className="text-sm font-medium">From CSS</p>
            <p className="text-xs text-muted-foreground">Paste CSS, get palette</p>
          </div>
        </Link>
      </div>

      {/* Palette grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : palettes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="text-5xl">🎨</div>
          <p className="text-lg font-semibold">No palettes yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Create your first palette from a screenshot, CSS, or build one manually.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {palettes.map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              onDelete={() => deletePalette(palette.id)}
              onCodeClick={() => router.push(`/chat/new?paletteId=${palette.id}`)}
              onSlidesClick={() => router.push(`/presentations/new?paletteId=${palette.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
