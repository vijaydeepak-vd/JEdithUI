"use client";

import { cn } from "@/lib/utils";

interface Version {
  version: number;
  modelName: string;
  createdAt: string;
}

interface VersionTimelineProps {
  versions: Version[];
  currentVersion: number;
  onRestore?: (version: number) => void;
}

export function VersionTimeline({
  versions,
  currentVersion,
  onRestore,
}: VersionTimelineProps) {
  if (versions.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 py-2 px-3 bg-muted/50 rounded-lg overflow-x-auto">
      <span className="text-[10px] text-muted-foreground font-medium shrink-0 mr-1">
        History:
      </span>
      {versions.map((v) => (
        <button
          key={v.version}
          onClick={() => onRestore?.(v.version)}
          title={`v${v.version} · ${v.modelName}`}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all",
            v.version === currentVersion
              ? "bg-jedith-forest text-white shadow-sm"
              : "bg-background border border-border text-muted-foreground hover:border-jedith-copper hover:text-jedith-copper"
          )}
        >
          {v.version}
        </button>
      ))}
      <span className="text-[10px] text-muted-foreground ml-1 shrink-0">
        v{currentVersion} current
      </span>
    </div>
  );
}
