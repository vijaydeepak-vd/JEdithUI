"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

interface ExportButtonsProps {
  code: string;
  onDownload?: () => void;
  label?: string;
}

export function ExportButtons({ code, onDownload, label = "code" }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copy}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-jedith-forest hover:text-jedith-forest transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copy {label}
          </>
        )}
      </button>

      {onDownload && (
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-jedith-forest hover:text-jedith-forest transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      )}
    </div>
  );
}
