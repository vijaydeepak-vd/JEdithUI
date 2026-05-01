"use client";

import Link from "next/link";
import { Trash2, Code2, Presentation, ArrowUpRight, Sparkles } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { PaletteData } from "@/types";

interface PaletteCardProps {
  palette: PaletteData;
  onDelete?: () => void;
  onCodeClick?: () => void;
  onSlidesClick?: () => void;
  onSkillClick?: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  IMAGE: "Screenshot",
  CSS: "CSS",
};

export function PaletteCard({
  palette,
  onDelete,
  onCodeClick,
  onSlidesClick,
  onSkillClick,
}: PaletteCardProps) {
  return (
    <div className="group relative bg-card border border-border rounded-2xl overflow-hidden card-hover shadow-sm">
      {/* Color bar strip — full width at top */}
      <div className="flex h-2.5 color-bar">
        {palette.colors.slice(0, 8).map((color, i) => (
          <div
            key={`${color.role}-${i}`}
            style={{ backgroundColor: color.hex }}
            title={`${color.role}: ${color.hex}`}
          />
        ))}
      </div>

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <Link
              href={`/palettes/${palette.id}`}
              className="group/link flex items-center gap-1 font-semibold text-sm text-foreground hover:text-jedith-copper transition-colors"
            >
              <span className="truncate">{palette.name}</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 flex-shrink-0 transition-opacity" />
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                {SOURCE_LABELS[palette.source] ?? palette.source}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {timeAgo(palette.updatedAt)}
              </span>
            </div>
          </div>

          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all flex-shrink-0"
            title="Delete palette"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Color dots row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {palette.colors.slice(0, 8).map((color, i) => (
            <div
              key={`${color.role}-${i}`}
              className="w-5 h-5 rounded-full border-2 border-white/10 shadow-sm ring-1 ring-white/5"
              style={{ backgroundColor: color.hex }}
              title={`${color.role}: ${color.hex}`}
            />
          ))}
          {palette.colors.length > 8 && (
            <div className="w-5 h-5 rounded-full bg-muted border-2 border-white/10 shadow-sm flex items-center justify-center">
              <span className="text-[8px] text-muted-foreground font-medium">
                +{palette.colors.length - 8}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCodeClick}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-jedith-forest text-white hover:bg-jedith-forest-light active:scale-95 transition-all"
          >
            <Code2 className="w-3.5 h-3.5" />
            Generate Code
          </button>
          <button
            onClick={onSlidesClick}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl border border-border text-muted-foreground hover:border-jedith-copper hover:text-jedith-copper active:scale-95 transition-all"
            title="Generate Slides"
          >
            <Presentation className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSkillClick}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl border border-purple-500/50 text-purple-400 hover:border-purple-400 hover:text-purple-300 hover:bg-purple-500/10 active:scale-95 transition-all"
            title="Download as Claude Skill"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
