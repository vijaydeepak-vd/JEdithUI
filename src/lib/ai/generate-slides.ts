import { chat } from "@/lib/ollama";
import { SLIDES_SYSTEM_PROMPT, SLIDES_REFINEMENT_PROMPT } from "./prompts/system-slides";
import { buildMarpContext } from "./prompts/marp-syntax";
import { countMarpSlides } from "@/lib/utils";
import type { PaletteColor, SlideTheme, OllamaChatMessage } from "@/types";

export interface SlideGenerationContext {
  prompt: string;
  model: string;
  palette: PaletteColor[];
  slideTheme: SlideTheme;
  existingMarkdown?: string;
}

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

  const messages: OllamaChatMessage[] = [
    { role: "system", content: systemPrompt },
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
