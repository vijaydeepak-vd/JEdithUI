"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Palette,
  MessageSquare,
  Presentation,
  FileCode2,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { OllamaStatus } from "./OllamaStatus";
import { cn } from "@/lib/utils";
import { dailyPromptLimit } from "@/lib/rate-limit-constants";
import {
  promptQuotaUpdatedEvent,
  readPromptQuotaSnapshot,
  type PromptQuotaSnapshot,
} from "@/lib/prompt-quota-client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/palettes", label: "Palettes", icon: Palette },
  { href: "/chat", label: "Code Chats", icon: MessageSquare },
  { href: "/presentations", label: "Presentations", icon: Presentation },
  { href: "/swagger", label: "Swagger Import", icon: FileCode2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [quota, setQuota] = useState<PromptQuotaSnapshot | null>(null);

  useEffect(() => {
    const sync = () => setQuota(readPromptQuotaSnapshot());

    sync();
    window.addEventListener(promptQuotaUpdatedEvent, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(promptQuotaUpdatedEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const limit = quota?.limit ?? dailyPromptLimit;
  const remaining = quota?.remaining ?? limit;
  const isUnlimited = quota?.unlimited === true;
  const used = Math.max(0, limit - remaining);
  const usedPercent = useMemo(() => {
    if (isUnlimited) return 100;
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }, [isUnlimited, limit, used]);

  const resetTimeLabel = useMemo(() => {
    if (isUnlimited) {
      return "Unlimited in local mode (localhost + local Ollama)";
    }
    if (!quota?.resetAt) return "Resets at next UTC midnight";

    const reset = new Date(quota.resetAt);
    if (Number.isNaN(reset.getTime())) return "Resets at next UTC midnight";

    return `Resets ${reset.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    })}`;
  }, [isUnlimited, quota?.resetAt]);

  return (
    <aside className="w-60 flex-shrink-0 h-screen flex flex-col sidebar-gradient">
      {/* Logo area */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-jedith-copper flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight leading-none">
              JEdithUI
            </span>
            <p className="text-white/40 text-[10px] leading-none mt-0.5 font-normal">
              Scan · Theme · Generate
            </p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/8 mb-3" />

      {/* Nav section label */}
      <p className="px-5 text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-1.5">
        Navigation
      </p>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-white/12 text-white shadow-sm"
                  : "text-white/50 hover:bg-white/6 hover:text-white/80"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-4 h-4 transition-colors",
                  active ? "text-jedith-copper" : "text-white/40"
                )}
              >
                <Icon className="w-full h-full" />
              </span>
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-jedith-copper" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: daily credits + Ollama status */}
      <div className="px-3 pb-4">
        <div className="rounded-xl bg-white/6 px-3 py-2.5 border border-white/8 mb-2.5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/45">
            <span className="text-white">Daily Credits</span>
            {isUnlimited ? (
              <span className="text-white text-xs">♾️</span>
            ) : (
              <span className="text-white text-xs">{`${remaining}/${limit}`}</span>
            )}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isUnlimited ? "bg-emerald-400" : "bg-jedith-copper"
              )}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/65">
            {isUnlimited ? "" : `${used} used today. `}
            {resetTimeLabel}
          </p>
        </div>
        <div className="rounded-xl bg-white/6 px-3 py-2.5 border border-white/8">
          <OllamaStatus />
        </div>
      </div>
    </aside>
  );
}
