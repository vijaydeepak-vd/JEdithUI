import type { PaletteColor } from "@/types";

// ─── Shared Types ─────────────────────────────────────

export interface SlideBlock {
  type: "heading" | "bullets" | "code" | "paragraph" | "table" | "image";
  level?: number;
  text?: string;
  items?: string[];
  rows?: string[][];
  src?: string;
}

export interface ParsedSlide {
  blocks: SlideBlock[];
  directives: string[];
  isTitle: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  surface: string;
}

// ─── Helpers ──────────────────────────────────────────

/** Extract palette colors into a flat theme object. */
export function extractColors(palette: PaletteColor[]): ThemeColors {
  const get = (role: string, fallback: string) =>
    palette.find((c) => c.role === role)?.hex ?? fallback;

  return {
    primary: get("primary", "#693FBD"),
    secondary: get("secondary", "#2a3580"),
    accent: get("accent", "#FF9F66"),
    background: get("background", "#ffffff"),
    text: get("text", "#1a1a1a"),
    surface: get("surface", "#f8f9fa"),
  };
}

/** Convert hex #RRGGBB → pptxgenjs-compatible hex (no #). */
export function hex(color: string): string {
  return color.replace("#", "");
}
