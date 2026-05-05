"use client";

import { useState, useEffect, useRef, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Code2,
  Eye,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useChatThread, useChatMessages } from "@/hooks/useChat";
import { db, generateId, nowISO } from "@/lib/db-client";
import { PromptInput } from "@/components/generator/PromptInput";
import { InlineModelSelector } from "@/components/generator/InlineModelSelector";
import { CodePreview } from "@/components/chat/CodePreview";
import { QuotaExceededModal } from "@/components/ui/QuotaExceededModal";
import { SkillNameModal } from "@/components/ui/SkillNameModal";
import { timeAgo, generateChatName } from "@/lib/utils";
import { buildFileContext, getFirstImageBase64 } from "@/lib/file-reader";
import { consumePendingAttachments } from "@/lib/pending-attachments";
import { useOllamaModels } from "@/hooks/useOllamaModels";
import { dailyQuotaErrorCode } from "@/lib/rate-limit-constants";
import {
  updatePromptQuotaFromHeaders,
  updatePromptQuotaFromPayload,
} from "@/lib/prompt-quota-client";
import type { MessageData, PaletteColor, Framework, UILibrary, AttachedFile } from "@/types";

type LeftTab = "preview" | "code";

function ChatPageInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const firstPrompt = searchParams.get("firstPrompt");

  const { chat, isLoading: chatLoading, refresh: refreshChat } = useChatThread(id);
  const {
    messages,
    isLoading: messagesLoading,
    refresh: refreshMessages,
  } = useChatMessages(id);

  const { models } = useOllamaModels();

  const [generating, setGenerating] = useState(false);
  const [firstPromptSent, setFirstPromptSent] = useState(false);
  const [activeTab, setActiveTab] = useState<LeftTab>("preview");
  const [copied, setCopied] = useState(false);
  const [downloadingSkill, setDownloadingSkill] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [quotaResetAt, setQuotaResetAt] = useState<string | undefined>();
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check if current model supports vision
  const currentModel = models.find((m) => m.name === chat?.modelName);
  const isVision = currentModel?.isVision ?? false;

  useEffect(() => {
    if (firstPrompt && !firstPromptSent && chat && messages.length === 0 && !messagesLoading) {
      setFirstPromptSent(true);
      // Pick up any attachments stored before the redirect from /chat/new
      const pendingFiles = consumePendingAttachments() ?? undefined;
      handleSend(firstPrompt, pendingFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPrompt, chat, messages.length, firstPromptSent, messagesLoading]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  // Chat metadata
  const palette: PaletteColor[] = chat?.palette?.colors ?? [];
  const framework: Framework = (chat?.framework as Framework) ?? "REACT";
  const libraries: UILibrary[] = (chat?.libraries as UILibrary[]) ?? [];

  const handleSend = async (prompt: string, attachments?: AttachedFile[]) => {
    if (!chat) return;
    setGenerating(true);

    // Process attachments: extract file context and first image
    const fileContext = attachments ? buildFileContext(attachments) : undefined;
    const imageBase64 = attachments ? getFirstImageBase64(attachments) : undefined;

    // Build chat history from existing messages (text only, no images)
    const chatHistory = messages.map((msg) => ({
      role: msg.role as "USER" | "ASSISTANT",
      content: msg.content,
    }));

    // Auto-name the chat from the first prompt
    if (chat.name === "Untitled Chat" || !chat.name) {
      await db.chats.update(id, { name: generateChatName(prompt), updatedAt: nowISO() });
      refreshChat();
    }

    // Save user message in IndexedDB
    const userMsgId = generateId();
    await db.messages.add({
      id: userMsgId,
      role: "USER",
      content: prompt,
      imageBase64,
      chatId: id,
      createdAt: nowISO(),
    });
    await refreshMessages();

    // Get existing code for refinement context
    const latestCodeVersions = await db.codeVersions
      .where("chatId")
      .equals(id)
      .reverse()
      .sortBy("version");
    const existingCode = latestCodeVersions[0]?.code;
    const currentVersion = latestCodeVersions[0]?.version ?? 0;

    try {
      // Call stateless generate API with all context + conversation history
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: chat.modelName,
          palette: palette.map((c) => ({ hex: c.hex, role: c.role, order: c.order ?? 0 })),
          libraries,
          framework,
          existingCode,
          imageBase64,
          fileContext,
          chatHistory,
        }),
      });

      updatePromptQuotaFromHeaders(res.headers);

      const data = await res.json();

      if (res.status === 429 && data.code === dailyQuotaErrorCode) {
        updatePromptQuotaFromPayload(data);
        await db.messages.delete(userMsgId);
        setQuotaResetAt(data.resetAt);
        setQuotaModalOpen(true);
        await refreshMessages();
        return;
      }

      if (res.ok && data.code) {
        // Save assistant message + code version in IndexedDB
        const assistantMsgId = generateId();
        const codeVersionId = generateId();
        const now = nowISO();

        await db.messages.add({
          id: assistantMsgId,
          role: "ASSISTANT",
          content:
            data.warnings?.length > 0
              ? `Generated successfully. ${data.warnings.length} warning(s): ${data.warnings.join("; ")}`
              : "Generated successfully.",
          chatId: id,
          createdAt: now,
        });

        await db.codeVersions.add({
          id: codeVersionId,
          code: data.code,
          language: data.language || "tsx",
          version: currentVersion + 1,
          modelName: chat.modelName,
          messageId: assistantMsgId,
          chatId: id,
          createdAt: now,
        });

        // Update chat timestamp
        await db.chats.update(id, { updatedAt: now });
      } else {
        // Save error as assistant message
        await db.messages.add({
          id: generateId(),
          role: "ASSISTANT",
          content: `Generation failed: ${data.error || "Unknown error"}`,
          chatId: id,
          createdAt: nowISO(),
        });
      }

      await refreshMessages();
    } catch (error) {
      // Network/parse error
      await db.messages.add({
        id: generateId(),
        role: "ASSISTANT",
        content: `Generation failed: ${error instanceof Error ? error.message : "Network error"}`,
        chatId: id,
        createdAt: nowISO(),
      });
      await refreshMessages();
    } finally {
      setGenerating(false);
    }
  };

  // ── Switch model mid-chat ──
  const handleModelChange = async (newModel: string) => {
    if (!chat || newModel === chat.modelName) return;
    await db.chats.update(id, { modelName: newModel, updatedAt: nowISO() });
    refreshChat();
  };

  // Latest code version
  const latestCodeMsg = [...messages].reverse().find((m) => m.codeVersion);
  const latestCode = latestCodeMsg?.codeVersion;

  // ── Copy code ──
  const handleCopy = async () => {
    if (!latestCode?.code) return;
    await navigator.clipboard.writeText(latestCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Download code ──
  const handleDownload = () => {
    if (!latestCode?.code) return;
    const ext = latestCode.language || "tsx";
    const blob = new Blob([latestCode.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chat?.name || "component"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Fix error from preview ──
  const handleFixError = (errorMsg: string) => {
    handleSend(
      `The preview shows this error: ${errorMsg}. Please fix the code so it renders correctly.`
    );
  };

  // ── Download as Claude Skill ──
  const handleDownloadSkill = async (skillName: string) => {
    if (!chat?.paletteId) return;
    setSkillModalOpen(false);
    setDownloadingSkill(true);
    try {
      const res = await fetch(`/api/palette/${chat.paletteId}/skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName,
          paletteName: chat.palette?.name || chat.name,
          colors: palette.map((c) => ({ hex: c.hex, role: c.role, order: c.order ?? 0 })),
          libraries,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate skill");
      const { filename, zipBase64 } = await res.json();
      const binary = atob(zipBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `${skillName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Skill download failed:", e);
    } finally {
      setDownloadingSkill(false);
    }
  };

  if (chatLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-6 h-6 border-2 border-jedith-forest border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-muted-foreground">Chat not found</p>
        <Link
          href="/chat"
          className="text-sm text-jedith-copper hover:underline"
        >
          Back to chats
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 flex-shrink-0">
        <Link
          href="/chat"
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{chat.name}</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
            <span>{chat.palette?.name} · {framework} · {libraries.join(", ") || "Tailwind"} ·</span>
            <InlineModelSelector
              value={chat.modelName}
              onChange={handleModelChange}
              disabled={generating}
            />
          </p>
        </div>

        {/* Actions */}
        {latestCode && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-jedith-copper text-white text-xs font-semibold hover:bg-[#E6853A] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              .{latestCode.language || "tsx"}
            </button>
            <button
              onClick={() => setSkillModalOpen(true)}
              disabled={downloadingSkill}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-500/50 text-xs font-medium text-purple-400 hover:text-purple-300 hover:border-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-40"
              title="Download as Claude Code skill"
            >
              {downloadingSkill ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Skill
            </button>
          </div>
        )}
      </div>

      {/* ── Main content: side by side ── */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: Code / Preview */}
        <div className="flex-1 flex flex-col border-r border-border bg-background">
          {latestCode ? (
            <>
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-border bg-card/30">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-jedith-forest text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "code"
                      ? "bg-jedith-forest text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Code
                </button>

                {/* Version info */}
                <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>v{latestCode.version}</span>
                  <span>·</span>
                  <span>{latestCode.language}</span>
                  <span>·</span>
                  <span>{latestCode.modelName}</span>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === "preview" ? (
                  <div className="h-full p-4">
                    <CodePreview
                      code={latestCode.code}
                      framework={framework}
                      libraries={libraries}
                      palette={palette}
                      onFixError={handleFixError}
                    />
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <pre className="text-xs text-zinc-100 p-5 font-mono leading-relaxed bg-zinc-950 min-h-full">
                      <code>{latestCode.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground p-8">
              <span className="text-5xl">✨</span>
              <p className="text-sm font-medium">No code yet</p>
              <p className="text-xs max-w-xs">
                Describe the UI you want in the chat — or attach a screenshot to
                recreate it. Code and preview will render here.
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
                <p className="text-xs">
                  Describe what you want to build, or attach a screenshot
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id}>
                  <div
                    className={`px-3 py-2.5 rounded-2xl text-sm ${
                      msg.role === "USER"
                        ? "bg-jedith-forest text-white rounded-tr-sm ml-4"
                        : "bg-secondary/50 border border-border rounded-tl-sm mr-4"
                    }`}
                  >
                    {/* Show attached image */}
                    {msg.imageBase64 && (
                      <div className="mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${msg.imageBase64}`}
                          alt="Attached screenshot"
                          className="max-w-full max-h-40 rounded-lg border border-white/20"
                        />
                      </div>
                    )}
                    {/* Show image badge if hasImage but no base64 */}
                    {!msg.imageBase64 && msg.hasImage && (
                      <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                        <ImageIcon className="w-3 h-3" />
                        <span>Screenshot attached</span>
                      </div>
                    )}
                    {msg.content}
                  </div>

                  {msg.codeVersion && (
                    <div className="mt-2 mr-4 bg-secondary/30 rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">
                        v{msg.codeVersion.version} ·{" "}
                        {msg.codeVersion.language} ·{" "}
                        {msg.codeVersion.modelName}
                      </p>
                      <pre className="text-[10px] bg-background text-foreground/80 p-2.5 rounded-lg overflow-x-auto max-h-32 font-mono leading-relaxed">
                        {msg.codeVersion.code.slice(0, 300)}
                        {msg.codeVersion.code.length > 300 ? "…" : ""}
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
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-copper animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-copper animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-jedith-copper animate-bounce [animation-delay:300ms]" />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Vision model warning */}
          {!isVision && (
            <div className="flex-shrink-0 px-3 pt-2">
              <p className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 flex-shrink-0" />
                <span>
                  <strong>{chat.modelName}</strong> doesn&apos;t support vision — image attachments will be ignored.
                  Switch to a vision model (🖼️) for screenshot-based generation.
                </span>
              </p>
            </div>
          )}

          {/* Prompt input */}
          <div className="flex-shrink-0 border-t border-border p-3">
            <PromptInput
              onSubmit={handleSend}
              loading={generating}
              placeholder={
                messages.length === 0
                  ? "Describe the UI you want…"
                  : "Refine — e.g. 'Add a dark mode toggle'"
              }
            />
          </div>
        </div>
      </div>

      {/* Skill name modal */}
      <SkillNameModal
        open={skillModalOpen}
        defaultName={chat.name}
        onConfirm={handleDownloadSkill}
        onCancel={() => setSkillModalOpen(false)}
      />

      <QuotaExceededModal
        open={quotaModalOpen}
        resetAt={quotaResetAt}
        onClose={() => setQuotaModalOpen(false)}
      />
    </div>
  );
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin w-6 h-6 border-2 border-jedith-copper border-t-transparent rounded-full" /></div>}>
      <ChatPageInner params={params} />
    </Suspense>
  );
}
