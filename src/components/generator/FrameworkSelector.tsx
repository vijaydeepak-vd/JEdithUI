"use client";

import { cn } from "@/lib/utils";
import type { Framework } from "@/types";

const FRAMEWORKS: { value: Framework; label: string; icon: string }[] = [
  { value: "REACT", label: "React", icon: "⚛️" },
  { value: "HTML", label: "HTML", icon: "🌐" },
  { value: "VUE", label: "Vue", icon: "💚" },
  { value: "SVELTE", label: "Svelte", icon: "🔥" },
  { value: "ANGULAR", label: "Angular", icon: "🅰️" },
];

const PHASE1 = new Set<Framework>(["REACT", "HTML"]);

interface FrameworkSelectorProps {
  value: Framework;
  onChange: (fw: Framework) => void;
}

export function FrameworkSelector({ value, onChange }: FrameworkSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FRAMEWORKS.map(({ value: fw, label, icon }) => {
        const isPhase1 = PHASE1.has(fw);
        return (
          <button
            key={fw}
            onClick={() => isPhase1 && onChange(fw)}
            disabled={!isPhase1}
            title={!isPhase1 ? "Coming in Phase 3" : undefined}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
              value === fw
                ? "border-jedith-forest bg-jedith-forest text-white"
                : isPhase1
                ? "border-border text-muted-foreground hover:border-jedith-forest hover:text-jedith-forest"
                : "border-border/50 text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            <span>{icon}</span>
            <span>{label}</span>
            {!isPhase1 && (
              <span className="text-[9px] opacity-60 ml-0.5">soon</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
