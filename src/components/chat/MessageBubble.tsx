"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Code2 } from "lucide-react";
import { CodePreview } from "./CodePreview";
import { ExportButtons } from "./ExportButtons";
import { VersionTimeline } from "./VersionTimeline";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { MessageData, Framework, UILibrary, PaletteColor } from "@/types";

interface MessageBubbleProps {
  message: MessageData;
  framework?: Framework;
  libraries?: UILibrary[];
  palette?: PaletteColor[];
  allVersions?: { version: number; modelName: string; createdAt: string }[];
  onFixError?: (err: string) => void;
  onRestoreVersion?: (v: number) => void;
}

export function MessageBubble({
  message,
  framework = "REACT",
  libraries = [],
  palette = [],
  allVersions = [],
  onFixError,
  onRestoreVersion,
}: MessageBubbleProps) {
  const [showCode, setShowCode] = useState(false);
  const isUser = message.role === "USER";
  const cv = message.codeVersion;

  const downloadCode = () => {
    if (!cv?.code) return;
    const ext = cv.language || "tsx";
    const blob = new Blob([cv.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `component.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-jedith-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
          J
        </div>
      )}

      <div className={cn("max-w-[85%] space-y-2", isUser && "items-end flex flex-col")}>
        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bg-jedith-navy text-white rounded-tr-sm"
              : "bg-card border border-border rounded-tl-sm"
          )}
        >
          {message.content}
        </div>

        {/* Code version block */}
        {cv && (
          <div className="w-full space-y-2">
            {/* Version timeline */}
            {allVersions.length > 1 && (
              <VersionTimeline
                versions={allVersions}
                currentVersion={cv.version}
                onRestore={onRestoreVersion}
              />
            )}

            {/* Code toggle + export */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowCode(!showCode)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>
                  v{cv.version} · {cv.language} · {cv.modelName}
                </span>
                {showCode ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              <ExportButtons code={cv.code} onDownload={downloadCode} />
            </div>

            {/* Syntax-highlighted code */}
            {showCode && (
              <pre className="text-xs bg-zinc-950 text-zinc-100 p-4 rounded-xl overflow-x-auto max-h-80 font-mono leading-relaxed">
                <code>{cv.code}</code>
              </pre>
            )}

            {/* Live preview */}
            <CodePreview
              code={cv.code}
              framework={framework}
              libraries={libraries}
              palette={palette}
              onFixError={onFixError}
            />
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-muted-foreground px-1">
          {timeAgo(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
