"use client";

import { usePalettes } from "@/hooks/usePalettes";
import { ColorSwatch } from "@/components/palette/ColorSwatch";
import { cn } from "@/lib/utils";

interface ThemeSelectorProps {
  value: string;
  onChange: (paletteId: string) => void;
  className?: string;
}

export function ThemeSelector({ value, onChange, className }: ThemeSelectorProps) {
  const { palettes, isLoading } = usePalettes();

  if (isLoading) {
    return (
      <div className={cn("animate-pulse h-10 bg-muted rounded-lg", className)} />
    );
  }

  if (palettes.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No palettes yet —{" "}
        <a href="/palettes" className="text-jedith-copper hover:underline">
          create one first
        </a>
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {palettes.map((palette) => (
        <button
          key={palette.id}
          onClick={() => onChange(palette.id)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all",
            value === palette.id
              ? "border-jedith-forest bg-jedith-forest/5"
              : "border-border hover:border-jedith-forest/50"
          )}
        >
          <div className="flex gap-1">
            {palette.colors.slice(0, 5).map((c) => (
              <ColorSwatch key={c.role} color={c} size="sm" />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground truncate">
            {palette.name}
          </span>
          {value === palette.id && (
            <span className="ml-auto text-xs text-jedith-forest font-medium">
              selected
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
