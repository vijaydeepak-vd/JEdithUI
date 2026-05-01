import { chat } from "@/lib/ollama";
import { SLIDES_SYSTEM_PROMPT, SLIDES_REFINEMENT_PROMPT } from "./prompts/system-slides";
import { buildMarpContext } from "./prompts/marp-syntax";
import { countMarpSlides } from "@/lib/utils";
import type { PaletteColor, SlideTheme, OllamaChatMessage } from "@/types";

interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SlideGenerationContext {
  prompt: string;
  model: string;
  palette: PaletteColor[];
  slideTheme: SlideTheme;
  existingMarkdown?: string;
  chatHistory?: ChatHistoryMessage[];
}

/** Max history turns to include. */
const MAX_HISTORY_TURNS = 10;

export interface SlideGenerationResult {
  markdown: string;
  slideCount: number;
  rawResponse: string;
}

/**
 * Generate Marp presentation markdown from a user prompt.
 */
export async function generateSlides(
  ctx: SlideGenerationContext
): Promise<SlideGenerationResult> {
  const isRefinement = !!ctx.existingMarkdown;
  const systemPrompt = isRefinement ? SLIDES_REFINEMENT_PROMPT : SLIDES_SYSTEM_PROMPT;
  const marpContext = buildMarpContext(ctx.palette, ctx.slideTheme);

  // Build history messages (text only, capped)
  const history: OllamaChatMessage[] = (ctx.chatHistory || [])
    .slice(-(MAX_HISTORY_TURNS * 2))
    .map((h) => ({
      role: h.role === "user" ? "user" as const : "assistant" as const,
      content: h.content,
    }));

  const messages: OllamaChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  if (isRefinement && ctx.existingMarkdown) {
    messages.push({
      role: "user",
      content: `${marpContext}\n\n## Current Presentation\n${ctx.existingMarkdown}\n\n## Refinement Request\n${ctx.prompt}`,
    });
  } else {
    messages.push({
      role: "user",
      content: `${marpContext}\n\n## Presentation Request\n${ctx.prompt}`,
    });
  }

  const response = await chat(ctx.model, messages);
  const rawResponse = response.message.content;

  // Extract markdown (strip code fences if present)
  let markdown = rawResponse;
  const markdownMatch = rawResponse.match(/```(?:markdown|marp)?\n([\s\S]*?)```/);
  if (markdownMatch) markdown = markdownMatch[1].trim();

  // Ensure it starts with marp frontmatter
  if (!markdown.startsWith("---")) {
    markdown = `---\nmarp: true\ntheme: jedith\npaginate: true\n---\n\n${markdown}`;
  }

  const slideCount = countMarpSlides(markdown);

  return { markdown, slideCount, rawResponse };
}
