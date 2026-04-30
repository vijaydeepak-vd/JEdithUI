"use client";

import { cn } from "@/lib/utils";
import type { SlideTheme, PaletteColor } from "@/types";

const SLIDE_THEMES: { id: SlideTheme; name: string; desc: string; emoji: string }[] = [
  { id: "business", name: "Business", desc: "Corporate, proposals", emoji: "🏢" },
  { id: "minimal", name: "Minimal", desc: "Academic, content-focused", emoji: "📄" },
  { id: "dark", name: "Dark", desc: "Tech talks, evening", emoji: "🌙" },
  { id: "tech", name: "Tech", desc: "Dev content, meetups", emoji: "💻" },
  { id: "colorful", name: "Colorful", desc: "Creative, events", emoji: "🎨" },
  { id: "gradient", name: "Gradient", desc: "Visual-focused decks", emoji: "🌈" },
  { id: "default", name: "Default", desc: "General presentations", emoji: "📊" },
];

interface SlideThemeSelectorProps {
  value: SlideTheme;
  onChange: (theme: SlideTheme) => void;
  palette?: PaletteColor[];
}

export function SlideThemeSelector({ value, onChange, palette }: SlideThemeSelectorProps) {
  const primaryColor = palette?.find((c) => c.role === "primary")?.hex || "#344620";
  const accentColor = palette?.find((c) => c.role === "accent")?.hex || "#d57a2a";
  const bgColor = palette?.find((c) => c.role === "background")?.hex || "#FFFFFF";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SLIDE_THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onChange(theme.id)}
          className={cn(
            "relative p-3 rounded-xl border text-left transition-all hover:shadow-md",
            value === theme.id
              ? "border-jedith-copper shadow-md ring-1 ring-jedith-copper"
              : "border-border hover:border-jedith-forest/50"
          )}
        >
          {/* Mini slide preview using palette colors */}
          <div
            className="w-full h-10 rounded-lg mb-2 flex items-center justify-center overflow-hidden"
            style={{
              background: theme.id === "dark"
                ? "#1a1a2e"
                : theme.id === "gradient"
                ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                : bgColor,
              border: `2px solid ${primaryColor}`,
            }}
          >
            <span style={{ color: primaryColor, fontSize: "10px", fontWeight: 700 }}>
              {theme.emoji} Aa
            </span>
          </div>

          <p className="text-xs font-semibold text-foreground">{theme.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{theme.desc}</p>

          {value === theme.id && (
            <span className="absolute top-1.5 right-1.5 text-jedith-copper text-xs">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
