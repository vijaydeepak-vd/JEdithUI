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

export interface GenerationContext {
  prompt: string;
  model: string;
  palette: PaletteColor[];
  libraries: UILibrary[];
  framework: Framework;
  existingCode?: string; // For refinements
  imageBase64?: string;  // Screenshot for vision-based generation
}

export interface GenerationResult {
  code: string;
  language: string;
  warnings: string[];
  rawResponse: string;
}

/**
 * Build messages for image-based code generation.
 *
 * Uses a 2-turn pattern so the vision model focuses on the image:
 *   Turn 1 (user):      Short instruction + image  → model analyzes screenshot
 *   Turn 2 (assistant): Acknowledgement             → primes for code output
 *   Turn 3 (user):      Technical requirements      → framework, libs, palette
 *
 * This avoids burying the image under walls of text that cause the model
 * to ignore the screenshot and generate generic output.
 */
function buildImageMessages(ctx: GenerationContext): OllamaChatMessage[] {
  const { lang, name } = getFrameworkMeta(ctx.framework);
  const userInstruction = ctx.prompt || "Recreate this exact UI";

  const colorSummary = ctx.palette
    .slice(0, 5)
    .map((c) => `${c.role}: ${c.hex}`)
    .join(", ");

  const libNames = ctx.libraries.join(", ") || "Tailwind CSS";

  return [
    // Turn 1: Image + short instruction — model focuses on the screenshot
    {
      role: "user",
      content: `Look at the attached screenshot carefully. ${userInstruction}`,
      images: [ctx.imageBase64!],
    },
    // Turn 2: Prime the model to recreate what it saw
    {
      role: "assistant",
      content: `I've analyzed the screenshot. I can see the full UI layout, components, spacing, and visual structure. Let me recreate it as a ${name} component now.`,
    },
    // Turn 3: Technical requirements — framework, libs, palette, output format
    {
      role: "user",
      content: [
        `Now generate the complete ${name} code that faithfully recreates the UI from the screenshot above.`,
        ``,
        `Requirements:`,
        `- Export a default function called \`App\``,
        `- Framework: ${ctx.framework}`,
        `- Libraries: ${libNames}`,
        `- Palette colors: ${colorSummary}`,
        `- Match the layout, spacing, typography, and component hierarchy from the screenshot EXACTLY`,
        `- Use real text content from the screenshot, not placeholder text`,
        `- Make it responsive`,
        ``,
        `Return ONLY the code in a single \`\`\`${lang} code block, no explanations.`,
      ].join("\n"),
    },
  ];
}

/**
 * Generate UI code from a user prompt.
 * Builds multi-layer prompt: system → library knowledge → theme → user request.
 * For images, uses a 2-turn conversation pattern to ensure vision focus.
 */
export async function generateCode(ctx: GenerationContext): Promise<GenerationResult> {
  const isRefinement = !!ctx.existingCode;
  const hasImage = !!ctx.imageBase64;
  const { lang, ext } = getFrameworkMeta(ctx.framework);

  let messages: OllamaChatMessage[];

  if (hasImage && !isRefinement) {
    // Image-based generation: use the 2-turn pattern (no system prompt)
    messages = buildImageMessages(ctx);
  } else {
    // Text-based generation or refinement: use system prompt + single user message
    const themeContext = buildThemeContext(ctx.palette, ctx.libraries);
    const libraryContext = buildLibraryPromptContext(ctx.libraries);
    const systemPrompt = isRefinement
      ? buildRefinementSystemPrompt(ctx.framework)
      : buildCodeSystemPrompt(ctx.framework);

    messages = [{ role: "system", content: systemPrompt }];

    if (isRefinement && ctx.existingCode) {
      const userMsg: OllamaChatMessage = {
        role: "user",
        content: `${themeContext}\n\n## Current Code\n\`\`\`${lang}\n${ctx.existingCode}\n\`\`\`\n\n## Refinement Request\n${ctx.prompt}`,
      };
      if (hasImage) {
        userMsg.images = [ctx.imageBase64!];
        userMsg.content += `\n\n(A reference screenshot has been attached — use it as visual context for the refinement.)`;
      }
      messages.push(userMsg);
    } else {
      const librarySection = libraryContext
        ? `\n\n## Library Reference\n${libraryContext}`
        : "";
      messages.push({
        role: "user",
        content: `${themeContext}${librarySection}\n\n## Code Generation Request\n${ctx.prompt}\n\nFramework: ${ctx.framework}\nLibraries: ${ctx.libraries.join(", ")}`,
      });
    }
  }

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
