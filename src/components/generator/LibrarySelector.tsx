"use client";

import { cn } from "@/lib/utils";
import type { UILibrary } from "@/types";

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
}

export function LibrarySelector({
  selected,
  onChange,
  primary,
  onPrimaryChange,
}: LibrarySelectorProps) {
  const toggle = (lib: UILibrary) => {
    if (selected.includes(lib)) {
      const next = selected.filter((l) => l !== lib);
      onChange(next);
      // If removing the primary, clear it
      if (lib === primary && onPrimaryChange && next.length > 0) {
        onPrimaryChange(next[0]);
      }
    } else {
      onChange([...selected, lib]);
      // Auto-set primary if none selected yet
      if (!primary && onPrimaryChange) onPrimaryChange(lib);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {LIBRARIES.map(({ value, label, desc }) => {
          const isSelected = selected.includes(value);
          const isPrimary = value === primary;
          return (
            <button
              key={value}
              onClick={() => toggle(value)}
              title={desc}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                isSelected
                  ? "border-jedith-navy bg-jedith-navy/10 text-jedith-navy"
                  : "border-border text-muted-foreground hover:border-jedith-navy/50"
              )}
            >
              {label}
              {isPrimary && (
                <span className="text-[9px] bg-jedith-coral text-white px-1 rounded-sm leading-tight">
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
