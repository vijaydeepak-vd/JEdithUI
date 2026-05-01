"use client";

import { AlertTriangle, Clock } from "lucide-react";

interface QuotaExceededModalProps {
  open: boolean;
  resetAt?: string;
  onClose: () => void;
}

function formatResetAt(resetAt?: string): string {
  if (!resetAt) {
    return "tomorrow";
  }

  const date = new Date(resetAt);
  if (Number.isNaN(date.getTime())) {
    return "tomorrow";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function QuotaExceededModal({
  open,
  resetAt,
  onClose,
}: QuotaExceededModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-copperwood-500/20 text-copperwood-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Daily quota exceeded</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You have used all 5 prompts available for today from this IP address.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-border bg-background px-3 py-2.5">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Credits reset: {formatResetAt(resetAt)}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-jedith-forest px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jedith-forest-light"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
