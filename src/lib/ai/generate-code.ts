import { chat } from "@/lib/ollama";
import {
  buildCodeSystemPrompt,
  buildRefinementSystemPrompt,
  getFrameworkMeta,
} from "./prompts/system";
import { buildThemeContext } from "./prompts/theme";
import { buildLibraryPromptContext } from "./library-configs";
import { postProcess } from "@/lib/post-process";
import type { PaletteColor, UILibrary, Framework, OllamaChatMessage } from "@/types";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerationContext {
  prompt: string;
  model: string;
  palette: PaletteColor[];
  libraries: UILibrary[];
  framework: Framework;
  existingCode?: string;        // For refinements
  imageBase64?: string;         // Screenshot for vision-based generation
  chatHistory?: ChatHistoryMessage[]; // Previous conversation turns
}

/** Max history turns to include (each turn = 1 user + 1 assistant). */
const MAX_HISTORY_TURNS = 10;

export interface GenerationResult {
  code: string;
  language: string;
  warnings: string[];
  rawResponse: string;
}

/**
 * Convert chat history to Ollama message format.
 * Keeps the last N turns to stay within context limits.
 * Strips images from history (too large, already processed).
 */
function buildHistoryMessages(history?: ChatHistoryMessage[]): OllamaChatMessage[] {
  if (!history || history.length === 0) return [];

  // Keep the most recent turns
  const trimmed = history.slice(-(MAX_HISTORY_TURNS * 2));

  return trimmed.map((h) => ({
    role: h.role === "user" ? "user" as const : "assistant" as const,
    content: h.content,
  }));
}

/**
 * Build a single user message for image-based code generation.
 *
 * Uses ONE message with image + concise instructions — same pattern as
 * the extract-theme route which is proven to work with Ollama vision models.
 *
 * Key: keep text SHORT so the model focuses on the image, not the prompt.
 */
function buildImageMessages(ctx: GenerationContext): OllamaChatMessage[] {
  const { lang, name } = getFrameworkMeta(ctx.framework);
  const userInstruction = ctx.prompt || "Recreate this exact UI";

  const colorSummary = ctx.palette
    .slice(0, 5)
    .map((c) => `${c.role}: ${c.hex}`)
    .join(", ");

  const libNames = ctx.libraries.join(", ") || "Tailwind CSS";

  const prompt = [
    `Look at this screenshot and ${userInstruction}.`,
    ``,
    `Generate a complete, self-contained ${name} component that recreates this UI.`,
    `Export a default function called \`App\`.`,
    `Use ${libNames} for styling.`,
    `Colors: ${colorSummary}.`,
    `Match the layout, spacing, and text from the screenshot exactly.`,
    `Return ONLY the code in a single \`\`\`${lang} block.`,
  ].join("\n");

  return [
    { role: "user", content: prompt, images: [ctx.imageBase64!] },
  ];
}

/**
 * Build messages for image-based refinement — existing code + screenshot.
 */
function buildImageRefinementMessages(ctx: GenerationContext): OllamaChatMessage[] {
  const { lang, name } = getFrameworkMeta(ctx.framework);

  const prompt = [
    `Look at this screenshot for visual reference.`,
    ``,
    `Here is the current ${name} code:`,
    `\`\`\`${lang}`,
    ctx.existingCode!,
    `\`\`\``,
    ``,
    `Refinement request: ${ctx.prompt}`,
    ``,
    `Return the COMPLETE updated code in a single \`\`\`${lang} block.`,
  ].join("\n");

  return [
    { role: "user", content: prompt, images: [ctx.imageBase64!] },
  ];
}

/**
 * Generate UI code from a user prompt.
 * For images: single message with image + concise instructions (no system prompt).
 * For text: system prompt + library knowledge + theme + user request.
 */
export async function generateCode(ctx: GenerationContext): Promise<GenerationResult> {
  const isRefinement = !!ctx.existingCode;
  const hasImage = !!ctx.imageBase64;
  const { lang, ext } = getFrameworkMeta(ctx.framework);

  const history = buildHistoryMessages(ctx.chatHistory);
  let messages: OllamaChatMessage[];
  let generationPath: string;

  if (hasImage && isRefinement) {
    generationPath = "IMAGE_REFINEMENT";
    messages = [...history, ...buildImageRefinementMessages(ctx)];
  } else if (hasImage) {
    generationPath = "IMAGE_NEW";
    messages = [...history, ...buildImageMessages(ctx)];
  } else if (isRefinement) {
    generationPath = "TEXT_REFINEMENT";
    const themeContext = buildThemeContext(ctx.palette, ctx.libraries);
    const systemPrompt = buildRefinementSystemPrompt(ctx.framework);
    messages = [{ role: "system", content: systemPrompt }, ...history];
    messages.push({
      role: "user",
      content: `${themeContext}\n\n## Current Code\n\`\`\`${lang}\n${ctx.existingCode}\n\`\`\`\n\n## Refinement Request\n${ctx.prompt}`,
    });
  } else {
    generationPath = "TEXT_NEW";
    const themeContext = buildThemeContext(ctx.palette, ctx.libraries);
    const libraryContext = buildLibraryPromptContext(ctx.libraries);
    const systemPrompt = buildCodeSystemPrompt(ctx.framework);
    const librarySection = libraryContext
      ? `\n\n## Library Reference\n${libraryContext}`
      : "";
    messages = [{ role: "system", content: systemPrompt }, ...history];
    messages.push({
      role: "user",
      content: `${themeContext}${librarySection}\n\n## Code Generation Request\n${ctx.prompt}\n\nFramework: ${ctx.framework}\nLibraries: ${ctx.libraries.join(", ")}`,
    });
  }

  // Debug: log the generation path and message structure
  console.log(`[generateCode] path: ${generationPath} | messages: ${messages.length} | history: ${history.length}`);
  messages.forEach((m, i) => {
    const hasImg = !!(m.images && m.images.length > 0);
    console.log(`  [msg ${i}] role=${m.role} | len=${m.content.length} | hasImage=${hasImg}`);
  });

  const response = await chat(ctx.model, messages);
  const rawResponse = response.message.content;
  const processed = await postProcess(rawResponse, ctx.libraries, ctx.palette, ext);

  return {
    code: processed.code,
    language: processed.language,
    warnings: processed.warnings,
    rawResponse,
  };
}
