"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideFilmstripProps {
  markdown: string;
  currentSlide?: number;
  onSlideSelect?: (index: number) => void;
  className?: string;
}

/**
 * Parse markdown into individual slide strings (split on `---` dividers).
 */
function parseSlides(markdown: string): string[] {
  // Remove front matter
  const withoutFM = markdown.replace(/^---[\s\S]*?---\n/, "").trim();
  return withoutFM
    .split(/^---$/m)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Render a single slide's markdown content into a simplified preview card.
 * This is a lightweight preview — full rendering happens in SlidePreview iframe.
 */
function SlideCard({
  content,
  index,
  active,
  onClick,
}: {
  content: string;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  // Extract title
  const titleMatch = content.match(/^#{1,3}\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : `Slide ${index + 1}`;

  // Count bullet points
  const bullets = (content.match(/^[-*]\s/gm) || []).length;
  const hasCode = content.includes("```");
  const hasTable = content.includes("|");

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-28 h-20 rounded-lg border-2 overflow-hidden transition-all text-left
        ${active ? "border-jedith-copper shadow-md scale-105" : "border-border hover:border-jedith-forest/50"}
      `}
    >
      <div className="w-full h-full p-1.5 bg-card flex flex-col gap-0.5">
        {/* Slide number badge */}
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-muted-foreground">
            {index + 1}
          </span>
          {(hasCode || hasTable) && (
            <span className="text-[7px] text-jedith-copper">
              {hasCode ? "{ }" : "⊞"}
            </span>
          )}
        </div>

        {/* Title line */}
        <div
          className="text-[7px] font-semibold text-foreground leading-tight"
          style={{ WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}
        >
          {title}
        </div>

        {/* Bullets indicator */}
        {bullets > 0 && (
          <div className="mt-auto flex flex-col gap-0.5">
            {Array.from({ length: Math.min(bullets, 4) }).map((_, i) => (
              <div
                key={i}
                className="h-0.5 rounded bg-muted-foreground/30"
                style={{ width: `${70 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

export function SlideFilmstrip({
  markdown,
  currentSlide = 0,
  onSlideSelect,
  className,
}: SlideFilmstripProps) {
  const slides = parseSlides(markdown);
  const [scrollOffset, setScrollOffset] = useState(0);
  const visible = 6;
  const maxOffset = Math.max(0, slides.length - visible);

  if (slides.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {/* Prev arrow */}
      <button
        onClick={() => setScrollOffset(Math.max(0, scrollOffset - 1))}
        disabled={scrollOffset === 0}
        className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors flex-shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Film strip */}
      <div className="flex gap-2 overflow-hidden">
        {slides
          .slice(scrollOffset, scrollOffset + visible)
          .map((slide, i) => {
            const idx = i + scrollOffset;
            return (
              <SlideCard
                key={idx}
                content={slide}
                index={idx}
                active={idx === currentSlide}
                onClick={() => onSlideSelect?.(idx)}
              />
            );
          })}
      </div>

      {/* Next arrow */}
      <button
        onClick={() => setScrollOffset(Math.min(maxOffset, scrollOffset + 1))}
        disabled={scrollOffset >= maxOffset}
        className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors flex-shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Count */}
      <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">
        {currentSlide + 1} / {slides.length}
      </span>
    </div>
  );
}
