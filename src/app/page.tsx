"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Code2,
  Presentation,
  MessageSquare,
  Palette,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";
import { PaletteCard } from "@/components/palette/PaletteCard";
import { SkillNameModal } from "@/components/ui/SkillNameModal";
import { usePalettes } from "@/hooks/usePalettes";
import { useChats } from "@/hooks/useChat";
import { timeAgo } from "@/lib/utils";
import type { PaletteData } from "@/types";

export default function Dashboard() {
  const router = useRouter();
  const { palettes, deletePalette, isLoading: loadingPalettes } = usePalettes();
  const { chats: codeChats, isLoading: loadingChats } = useChats("CODE");
  const { chats: presentationChats } = useChats("PRESENTATION");

  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillPalette, setSkillPalette] = useState<PaletteData | null>(null);

  const handlePaletteCode = (palette: PaletteData) => {
    router.push(`/chat/new?paletteId=${palette.id}`);
  };

  const handlePaletteSlides = (palette: PaletteData) => {
    router.push(`/presentations/new?paletteId=${palette.id}`);
  };

  const handleSkillClick = (palette: PaletteData) => {
    setSkillPalette(palette);
    setSkillModalOpen(true);
  };

  const handleDownloadSkill = async (skillName: string) => {
    if (!skillPalette) return;
    setSkillModalOpen(false);
    try {
      const res = await fetch(`/api/palette/${skillPalette.id}/skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName,
          paletteName: skillPalette.name,
          colors: skillPalette.colors.map((c) => ({ hex: c.hex, role: c.role, order: c.order ?? 0 })),
          libraries: [],
        }),
      });
      if (!res.ok) throw new Error("Failed to generate skill");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        `${skillName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Skill download failed:", e);
    }
  };

  const totalChats = codeChats.length + presentationChats.length;

  return (
    <div className="min-h-full">
      {/* Top hero bar */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Your palettes, chats and presentations</p>
          </div>
          <Link
            href="/palettes/new"
            className="flex items-center gap-2 px-4 py-2 bg-jedith-forest text-white rounded-xl text-sm font-semibold hover:bg-jedith-forest-light active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Palette
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* Stat cards row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Palettes"
            value={palettes.length}
            icon={<Palette className="w-5 h-5" />}
            color="navy"
            href="/palettes"
          />
          <StatCard
            label="Code Chats"
            value={codeChats.length}
            icon={<Code2 className="w-5 h-5" />}
            color="coral"
            href="/chat"
          />
          <StatCard
            label="Presentations"
            value={presentationChats.length}
            icon={<Presentation className="w-5 h-5" />}
            color="ice"
            href="/presentations"
          />
        </div>

        {/* Palettes section */}
        <section>
          <SectionHeader
            icon={<Palette className="w-4 h-4" />}
            title="My Palettes"
            href="/palettes"
            count={palettes.length}
          />

          {loadingPalettes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : palettes.length === 0 ? (
            <EmptyState
              icon={<Palette className="w-10 h-10" />}
              title="No palettes yet"
              desc="Create your first palette from a screenshot, CSS variables, or build it manually."
              cta="Create Palette"
              href="/palettes/new"
              accent="navy"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {palettes.slice(0, 6).map((palette) => (
                <PaletteCard
                  key={palette.id}
                  palette={palette}
                  onDelete={() => deletePalette(palette.id)}
                  onCodeClick={() => handlePaletteCode(palette)}
                  onSlidesClick={() => handlePaletteSlides(palette)}
                  onSkillClick={() => handleSkillClick(palette)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Chats + Presentations row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Chats */}
          <section>
            <SectionHeader
              icon={<MessageSquare className="w-4 h-4" />}
              title="Recent Code Chats"
              href="/chat"
              count={codeChats.length}
            />

            {loadingChats ? (
              <ChatListSkeleton />
            ) : codeChats.length === 0 ? (
              <EmptyState
                icon={<Code2 className="w-8 h-8" />}
                title="No code chats yet"
                desc="Pick a palette and start generating themed components."
                cta="New Chat"
                href="/chat/new"
                accent="coral"
                compact
              />
            ) : (
              <div className="space-y-2">
                {codeChats.slice(0, 5).map((chat) => (
                  <ChatRow
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    icon={<Code2 className="w-3.5 h-3.5" />}
                    name={chat.name}
                    meta={`${chat.messageCount} msgs · v${chat.latestVersion} · ${chat.modelName}`}
                    time={timeAgo(chat.updatedAt)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Presentations */}
          <section>
            <SectionHeader
              icon={<Presentation className="w-4 h-4" />}
              title="Recent Presentations"
              href="/presentations"
              count={presentationChats.length}
            />

            {presentationChats.length === 0 ? (
              <EmptyState
                icon={<Presentation className="w-8 h-8" />}
                title="No presentations yet"
                desc="Generate Marp slide decks from your brand palettes."
                cta="New Presentation"
                href="/presentations/new"
                accent="coral"
                compact
              />
            ) : (
              <div className="space-y-2">
                {presentationChats.slice(0, 5).map((chat) => (
                  <ChatRow
                    key={chat.id}
                    href={`/presentations/${chat.id}`}
                    icon={<Presentation className="w-3.5 h-3.5" />}
                    name={chat.name}
                    meta={`${chat.messageCount} msgs · ${chat.slideTheme ?? "default"} theme`}
                    time={timeAgo(chat.updatedAt)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Quick-start banner — only shown when everything is empty */}
        {palettes.length === 0 && totalChats === 0 && !loadingPalettes && !loadingChats && (
          <div className="relative overflow-hidden rounded-2xl border border-jedith-forest/20 bg-gradient-to-br from-jedith-forest to-[#1a2310] p-6 text-white">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 80% 50%, #d57a2a 0%, transparent 60%)",
              }}
            />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-jedith-copper" />
                  <span className="text-xs font-semibold text-jedith-copper uppercase tracking-wider">
                    Get Started
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">Create your first palette</h3>
                <p className="text-sm text-white/60">
                  Upload a screenshot or paste CSS variables to extract your brand colors, then generate themed UI code instantly.
                </p>
              </div>
              <Link
                href="/palettes/new"
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-jedith-copper text-white rounded-xl text-sm font-semibold hover:bg-[#aa6122] active:scale-95 transition-all shadow-lg"
              >
                Start Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Skill name modal */}
      <SkillNameModal
        open={skillModalOpen}
        defaultName={skillPalette?.name || ""}
        onConfirm={handleDownloadSkill}
        onCancel={() => setSkillModalOpen(false)}
      />
    </div>
  );
}

/* ── Sub-components ─────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "navy" | "coral" | "ice";
  href: string;
}) {
  const styles = {
    navy: "bg-jedith-forest text-white",
    coral: "bg-jedith-copper text-white",
    ice: "bg-jedith-sage text-jedith-forest",
  };

  return (
    <Link
      href={href}
      className="group bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${styles[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function SectionHeader({
  icon,
  title,
  href,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-jedith-copper">{icon}</span>
        {title}
        {count > 0 && (
          <span className="ml-0.5 text-[11px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </h2>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-jedith-copper transition-colors"
      >
        View all <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function ChatRow({
  href,
  icon,
  name,
  meta,
  time,
}: {
  href: string;
  icon: React.ReactNode;
  name: string;
  meta: string;
  time: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-jedith-forest/30 hover:shadow-sm hover:-translate-y-px transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-muted-foreground group-hover:text-jedith-forest transition-colors flex-shrink-0">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-jedith-forest transition-colors">
            {name}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
        <Clock className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-[11px] text-muted-foreground">{time}</span>
      </div>
    </Link>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  cta,
  href,
  accent,
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
  accent: "navy" | "coral";
  compact?: boolean;
}) {
  const btnStyle =
    accent === "navy"
      ? "bg-jedith-forest hover:bg-jedith-forest-light"
      : "bg-jedith-copper hover:bg-[#aa6122]";

  return (
    <div
      className={`flex flex-col items-center justify-center text-center border border-dashed border-border rounded-2xl ${
        compact ? "p-6 gap-2" : "p-10 gap-3"
      }`}
    >
      <div className="text-muted-foreground/30">{icon}</div>
      <div>
        <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{desc}</p>
      </div>
      <Link
        href={href}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 ${btnStyle} text-white rounded-xl transition-colors active:scale-95`}
      >
        <Plus className="w-3.5 h-3.5" />
        {cta}
      </Link>
    </div>
  );
}

function ChatListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[58px] bg-muted rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
