import { NextRequest, NextResponse } from "next/server";
import { generateSlides } from "@/lib/ai/generate-slides";
import {
  buildQuotaExceededPayload,
  consumeDailyPromptCredit,
  getClientIp,
} from "@/lib/rate-limit";
import { z } from "zod";
import type { PaletteColor, SlideTheme } from "@/types";

/**
 * POST /api/presentation/generate  (STATELESS)
 *
 * Accepts all context from the client and returns generated slide markdown.
 * No database reads or writes — the client manages persistence in IndexedDB.
 */
const ChatHistoryEntry = z.object({
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string(),
});

const GenerateSlidesSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().min(1),
  palette: z.array(
    z.object({ hex: z.string(), role: z.string(), order: z.number() })
  ),
  slideTheme: z.string().default("business"),
  existingMarkdown: z.string().optional(),
  fileContext: z.string().optional(),
  chatHistory: z.array(ChatHistoryEntry).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateSlidesSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const quota = await consumeDailyPromptCredit(getClientIp(req));
  if (!quota.allowed) {
    return NextResponse.json(buildQuotaExceededPayload(quota), { status: 429 });
  }

  const { prompt, model, palette, slideTheme, existingMarkdown, fileContext, chatHistory } = parsed.data;

  // Prepend file context to the prompt so the AI sees attached file contents
  const enrichedPrompt = fileContext ? `${fileContext}${prompt}` : prompt;

  try {
    const result = await generateSlides({
      prompt: enrichedPrompt,
      model,
      palette: palette as PaletteColor[],
      slideTheme: slideTheme as SlideTheme,
      existingMarkdown,
      chatHistory: chatHistory.map((h) => ({
        role: h.role.toLowerCase() as "user" | "assistant",
        content: h.content,
      })),
    });

    const response = NextResponse.json({
      markdown: result.markdown,
      slideCount: result.slideCount,
    });

    response.headers.set("X-RateLimit-Limit", String(quota.limit));
    response.headers.set("X-RateLimit-Remaining", String(quota.remaining));
    response.headers.set("X-RateLimit-Reset", quota.resetAt);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Slide generation failed" },
      { status: 500 }
    );
  }
}
