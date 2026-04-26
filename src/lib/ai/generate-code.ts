import { chat } from "@/lib/ollama";
import { CODE_SYSTEM_PROMPT, REFINEMENT_SYSTEM_PROMPT, IMAGE_SYSTEM_PROMPT } from "./prompts/system";
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
 * Generate UI code from a user prompt.
 * Builds 4-layer prompt: system → library knowledge → theme → user request.
 * Supports optional screenshot via Ollama vision models.
 */
export async function generateCode(ctx: GenerationContext): Promise<GenerationResult> {
  const isRefinement = !!ctx.existingCode;
  const hasImage = !!ctx.imageBase64;
  const themeContext = buildThemeContext(ctx.palette, ctx.libraries);
  const libraryContext = buildLibraryPromptContext(ctx.libraries);

  // Pick the right system prompt
  let systemPrompt: string;
  if (hasImage && !isRefinement) {
    systemPrompt = IMAGE_SYSTEM_PROMPT;
  } else if (isRefinement) {
    systemPrompt = REFINEMENT_SYSTEM_PROMPT;
  } else {
    systemPrompt = CODE_SYSTEM_PROMPT;
  }

  const messages: OllamaChatMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  if (isRefinement && ctx.existingCode) {
    // Refinement: send current code + new instruction
    const userMsg: OllamaChatMessage = {
      role: "user",
      content: `${themeContext}\n\n## Current Code\n\`\`\`tsx\n${ctx.existingCode}\n\`\`\`\n\n## Refinement Request\n${ctx.prompt}`,
    };
    // Attach image if provided during refinement
    if (hasImage) {
      userMsg.images = [ctx.imageBase64!];
      userMsg.content += `\n\n(A reference screenshot has been attached — use it as visual context for the refinement.)`;
    }
    messages.push(userMsg);
  } else if (hasImage) {
    // Image-based generation: attach image to the user message
    const librarySection = libraryContext
      ? `\n\n## Library Reference\n${libraryContext}`
      : "";
    messages.push({
      role: "user",
      content: `${themeContext}${librarySection}\n\n## Screenshot-Based Code Generation\nRecreate the UI shown in the attached screenshot as a React component.\n\nAdditional instructions: ${ctx.prompt}\n\nFramework: ${ctx.framework}\nLibraries: ${ctx.libraries.join(", ")}`,
      images: [ctx.imageBase64!],
    });
  } else {
    // Fresh text-only generation
    const librarySection = libraryContext
      ? `\n\n## Library Reference\n${libraryContext}`
      : "";
    messages.push({
      role: "user",
      content: `${themeContext}${librarySection}\n\n## Code Generation Request\n${ctx.prompt}\n\nFramework: ${ctx.framework}\nLibraries: ${ctx.libraries.join(", ")}`,
    });
  }

  const response = await chat(ctx.model, messages);
  const rawResponse = response.message.content;

  const defaultLang = ctx.framework === "HTML" ? "html" : "tsx";
  const processed = await postProcess(rawResponse, ctx.libraries, ctx.palette, defaultLang);

  return {
    code: processed.code,
    language: processed.language,
    warnings: processed.warnings,
    rawResponse,
  };
}
