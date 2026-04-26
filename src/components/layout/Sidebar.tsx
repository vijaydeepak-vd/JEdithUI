"use client";

import Link from "next/link";
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

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/palettes", label: "Palettes", icon: Palette },
  { href: "/chat", label: "Code Chats", icon: MessageSquare },
  { href: "/presentations", label: "Presentations", icon: Presentation },
  { href: "/swagger", label: "Swagger Import", icon: FileCode2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 h-screen flex flex-col sidebar-gradient">
      {/* Logo area */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-jedith-coral flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
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
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
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
                  active ? "text-jedith-coral" : "text-white/40"
                )}
              >
                <Icon className="w-full h-full" />
              </span>
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-jedith-coral" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Ollama status */}
      <div className="px-3 pb-4">
        <div className="rounded-xl bg-white/6 px-3 py-2.5 border border-white/8">
          <OllamaStatus />
        </div>
      </div>
    </aside>
  );
}
