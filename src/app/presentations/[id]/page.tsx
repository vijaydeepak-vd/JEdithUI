"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, FileDown, Loader2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useChatThread } from "@/hooks/useChat";
import { PromptInput } from "@/components/generator/PromptInput";
import { SlidePreview } from "@/components/chat/SlidePreview";
import { SlideFilmstrip } from "@/components/chat/SlideFilmstrip";
import { timeAgo } from "@/lib/utils";
import useSWR from "swr";
import type { MessageData, PaletteColor, SlideTheme } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PresentationChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const firstPrompt = searchParams.get("firstPrompt");

  const { chat } = useChatThread(id);
  const { data: messagesData, mutate: refreshMessages } = useSWR(
    id ? `/api/chat/${id}/messages` : null,
    fetcher
  );

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [generating, setGenerating] = useState(false);
  const [firstPromptSent, setFirstPromptSent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesData?.messages) setMessages(messagesData.messages);
  }, [messagesData]);

  useEffect(() => {
    if (firstPrompt && !firstPromptSent && chat && messages.length === 0) {
      setFirstPromptSent(true);
      handleSend(firstPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPrompt, chat, messages.length, firstPromptSent]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  const handleSend = async (prompt: string) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/presentation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: id, prompt }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentSlide(0);
        // Let SWR be the single source of truth — avoids duplicate keys
        // from local append + SWR revalidation racing
        await refreshMessages();
      }
    } finally {
      setGenerating(false);
    }
  };

  // Latest slide version
  const latestSlideMsg = [...messages].reverse().find((m) => m.slideVersion);
  const latestSlide = latestSlideMsg?.slideVersion;

  // Palette data from chat
  const palette: PaletteColor[] = chat?.palette?.colors ?? [];
  const slideTheme: SlideTheme = (chat?.slideTheme as SlideTheme) ?? "default";

  // ── Export PPTX ──
  const handleExportPptx = async () => {
    if (!latestSlide?.markdown) return;
    setExporting(true);
    try {
      const res = await fetch("/api/presentation/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: latestSlide.markdown,
          format: "pptx",
          palette: palette.map((c) => ({ hex: c.hex, role: c.role, order: c.order ?? 0 })),
          theme: slideTheme,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chat?.name || "presentation"}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  // ── Copy Markdown ──
  const handleCopy = async () => {
    if (!latestSlide?.markdown) return;
    await navigator.clipboard.writeText(latestSlide.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Download Markdown ──
  const handleDownloadMd = () => {
    if (!latestSlide?.markdown) return;
    const blob = new Blob([latestSlide.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chat?.name || "presentation"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-6 h-6 border-2 border-jedith-coral border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 flex-shrink-0">
        <Link href="/presentations" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{chat.name}</h1>
          <p className="text-[11px] text-muted-foreground">
            {chat.palette?.name} · {slideTheme} theme · {chat.modelName}
          </p>
        </div>

        {/* Export actions */}
        {latestSlide && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy MD"}
            </button>
            <button
              onClick={handleDownloadMd}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              .md
            </button>
            <button
              onClick={handleExportPptx}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-jedith-coral text-white text-xs font-semibold hover:bg-[#e8505a] disabled:opacity-50 transition-colors"
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              {exporting ? "Exporting…" : "Download PPTX"}
            </button>
          </div>
        )}
      </div>

      {/* ── Main content: side by side ── */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: Slide Preview */}
        <div className="flex-1 flex flex-col border-r border-border bg-background">
          {latestSlide ? (
            <>
              {/* Slide preview iframe */}
              <div className="flex-1 min-h-0 p-4">
                <SlidePreview
                  markdown={latestSlide.markdown}
                  palette={palette}
                  theme={slideTheme}
                  currentSlide={currentSlide}
                  className="h-full"
                />
              </div>

              {/* Filmstrip */}
              <div className="flex-shrink-0 border-t border-border px-4 py-3 bg-card/50">
                <SlideFilmstrip
                  markdown={latestSlide.markdown}
                  currentSlide={currentSlide}
                  onSlideSelect={setCurrentSlide}
                />
              </div>

              {/* Version info */}
              <div className="flex-shrink-0 px-4 pb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>v{latestSlide.version}</span>
                <span>·</span>
                <span>{latestSlide.slideCount} slides</span>
                <span>·</span>
                <span>{latestSlide.modelName}</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground p-8">
              <span className="text-5xl">📊</span>
              <p className="text-sm font-medium">No slides yet</p>
              <p className="text-xs max-w-xs">
                Describe your presentation in the chat — slides will render here.
              </p>
            </div>
          )}
        </div>

        {/* Right panel: Chat thread */}
        <div className="w-96 flex flex-col bg-card/30 flex-shrink-0">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !generating ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground">
                <p className="text-sm font-medium">Start the conversation</p>
                <p className="text-xs">Describe what your presentation should cover</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id}>
                  <div
                    className={`px-3 py-2.5 rounded-2xl text-sm ${
                      msg.role === "USER"
                        ? "bg-jedith-navy text-white rounded-tr-sm ml-4"
                        : "bg-secondary/50 border border-border rounded-tl-sm mr-4"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.slideVersion && (
                    <div className="mt-2 mr-4 bg-secondary/30 rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">
                        v{msg.slideVersion.version} · {msg.slideVersion.slideCount} slides
                      </p>
                      <pre className="text-[10px] bg-background text-foreground/80 p-2.5 rounded-lg overflow-x-auto max-h-32 font-mono leading-relaxed">
                        {msg.slideVersion.markdown.slice(0, 300)}
                        {msg.slideVersion.markdown.length > 300 ? "…" : ""}
                      </pre>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground px-1 mt-1">
                    {timeAgo(msg.createdAt)}
                  </p>
                </div>
              ))
            )}

            {generating && (
              <div className="flex gap-2 items-center mr-4 px-3 py-2.5 rounded-2xl rounded-tl-sm bg-secondary/50 border border-border w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-coral animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-coral animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-coral animate-bounce [animation-delay:300ms]" />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Prompt input */}
          <div className="flex-shrink-0 border-t border-border p-3">
            <PromptInput
              onSubmit={handleSend}
              loading={generating}
              placeholder={
                messages.length === 0
                  ? "Describe your presentation…"
                  : "Refine — e.g. 'Add a slide about pricing'"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
