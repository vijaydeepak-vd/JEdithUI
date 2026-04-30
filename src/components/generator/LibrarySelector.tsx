"use client";

import { cn } from "@/lib/utils";
import { LIBRARY_CONFIGS } from "@/lib/ai/library-configs";
import type { UILibrary, Framework } from "@/types";

const LIBRARIES: { value: UILibrary; label: string; desc: string }[] = [
  { value: "tailwind", label: "Tailwind CSS", desc: "Layout & custom styling" },
  { value: "shadcn", label: "shadcn/ui", desc: "Base components" },
  { value: "mui", label: "Material UI", desc: "Data-heavy components" },
  { value: "antd", label: "Ant Design", desc: "Tables, forms" },
  { value: "chakra", label: "Chakra UI", desc: "Accessible components" },
  { value: "mantine", label: "Mantine", desc: "Hooks + components" },
  { value: "recharts", label: "Recharts", desc: "Charts & graphs" },
  { value: "react-table", label: "React Table", desc: "Headless tables" },
];

interface LibrarySelectorProps {
  selected: UILibrary[];
  onChange: (libs: UILibrary[]) => void;
  primary?: UILibrary;
  onPrimaryChange?: (lib: UILibrary) => void;
  /** When provided, only compatible libraries are enabled. */
  framework?: Framework;
}

function isCompatible(lib: UILibrary, framework?: Framework): boolean {
  if (!framework) return true;
  const config = LIBRARY_CONFIGS[lib];
  return config.frameworks.includes(framework);
}

export function LibrarySelector({
  selected,
  onChange,
  primary,
  onPrimaryChange,
  framework,
}: LibrarySelectorProps) {
  const toggle = (lib: UILibrary) => {
    if (!isCompatible(lib, framework)) return;

    if (selected.includes(lib)) {
      const next = selected.filter((l) => l !== lib);
      onChange(next);
      if (lib === primary && onPrimaryChange && next.length > 0) {
        onPrimaryChange(next[0]);
      }
    } else {
      onChange([...selected, lib]);
      if (!primary && onPrimaryChange) onPrimaryChange(lib);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {LIBRARIES.map(({ value, label, desc }) => {
          const compatible = isCompatible(value, framework);
          const isSelected = selected.includes(value);
          const isPrimary = value === primary;
          return (
            <button
              key={value}
              onClick={() => toggle(value)}
              disabled={!compatible}
              title={
                !compatible
                  ? `${label} is not compatible with ${framework}`
                  : desc
              }
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                !compatible
                  ? "border-border/40 text-muted-foreground/30 cursor-not-allowed line-through"
                  : isSelected
                  ? "border-jedith-forest bg-jedith-forest/10 text-jedith-forest"
                  : "border-border text-muted-foreground hover:border-jedith-forest/50"
              )}
            >
              {label}
              {isPrimary && compatible && (
                <span className="text-[9px] bg-jedith-copper text-white px-1 rounded-sm leading-tight">
                  primary
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Primary picker — only shows when multiple selected */}
      {selected.length > 1 && onPrimaryChange && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Primary:</span>
          <select
            value={primary}
            onChange={(e) => onPrimaryChange(e.target.value as UILibrary)}
            className="text-xs border border-border rounded px-2 py-0.5 bg-background"
          >
            {selected.map((lib) => (
              <option key={lib} value={lib}>{lib}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
