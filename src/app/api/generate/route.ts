import { NextRequest, NextResponse } from "next/server";
import { generateCode } from "@/lib/ai/generate-code";
import { isVisionModel } from "@/lib/ollama";
import {
  buildQuotaExceededPayload,
  consumeDailyPromptCredit,
  getClientIp,
} from "@/lib/rate-limit";
import { z } from "zod";
import type { UILibrary, Framework, PaletteColor } from "@/types";

/**
 * POST /api/generate  (STATELESS)
 *
 * Accepts all context from the client (palette, framework, libraries, etc.)
 * and returns generated code. No database reads or writes — the client
 * manages persistence in IndexedDB via Dexie.
 */
const ChatHistoryEntry = z.object({
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string(),
});

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().min(1),
  palette: z.array(
    z.object({ hex: z.string(), role: z.string(), order: z.number() })
  ),
  libraries: z.array(z.string()).default([]),
  framework: z.enum(["REACT", "VUE", "SVELTE", "ANGULAR", "HTML"]).default("REACT"),
  existingCode: z.string().optional(),
  imageBase64: z.string().optional(),
  fileContext: z.string().optional(),
  chatHistory: z.array(ChatHistoryEntry).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const quota = await consumeDailyPromptCredit(getClientIp(req));
  if (!quota.allowed) {
    return NextResponse.json(buildQuotaExceededPayload(quota), { status: 429 });
  }

  const { prompt, model, palette, libraries, framework, existingCode, imageBase64, fileContext, chatHistory } =
    parsed.data;

  // Vision model check — strip image if model can't process it
  const extraWarnings: string[] = [];
  let effectiveImage = imageBase64;
  if (imageBase64 && !isVisionModel(model)) {
    effectiveImage = undefined;
    extraWarnings.push(
      `Model "${model}" does not support vision. The attached image was ignored. Switch to a vision model (e.g. gemma4) for screenshot-based generation.`
    );
  }

  // Prepend file context to the prompt so the AI sees attached file contents
  const enrichedPrompt = fileContext ? `${fileContext}${prompt}` : prompt;

  // Debug: log what's being sent to the AI
  console.log("[generate] model:", model, "| framework:", framework);
  console.log("[generate] hasImage:", !!effectiveImage, "| imageSize:", effectiveImage?.length ?? 0);
  console.log("[generate] hasExistingCode:", !!existingCode, "| prompt:", enrichedPrompt.slice(0, 100));

  try {
    const result = await generateCode({
      prompt: enrichedPrompt,
      model,
      palette: palette as PaletteColor[],
      libraries: libraries as UILibrary[],
      framework: framework as Framework,
      existingCode,
      imageBase64: effectiveImage,
      chatHistory: chatHistory.map((h) => ({
        role: h.role.toLowerCase() as "user" | "assistant",
        content: h.content,
      })),
    });

    const response = NextResponse.json({
      code: result.code,
      language: result.language,
      warnings: [...extraWarnings, ...result.warnings],
    });

    response.headers.set("X-RateLimit-Limit", String(quota.limit));
    response.headers.set("X-RateLimit-Remaining", String(quota.remaining));
    response.headers.set("X-RateLimit-Reset", quota.resetAt);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
