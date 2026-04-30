import { extractCode, detectLanguage } from "./extract-code";
import { validateImports } from "./validate-imports";
import { checkThemeCompliance } from "./theme-compliance";
import type { UILibrary, PaletteColor } from "@/types";

export interface PostProcessResult {
  code: string;
  language: string;
  warnings: string[];
  importWarnings: string[];
  themeWarnings: string[];
}

/**
 * Full post-processing pipeline for AI-generated code.
 * 1. Extract code from markdown
 * 2. Validate imports against selected libraries
 * 3. Check theme compliance
 * 4. (Prettier formatting is optional — skipped if it fails)
 */
export async function postProcess(
  rawOutput: string,
  selectedLibraries: UILibrary[],
  palette: PaletteColor[],
  defaultLanguage = "tsx"
): Promise<PostProcessResult> {
  const code = extractCode(rawOutput);
  const language = detectLanguage(rawOutput, defaultLanguage);

  const importResult = validateImports(code, selectedLibraries);
  const themeWarnings = checkThemeCompliance(code, palette);

  // Attempt prettier formatting — silently skip on failure
  let formattedCode = code;
  try {
    const prettier = await import("prettier");
    const parserMap: Record<string, string> = {
      html: "html", vue: "vue", svelte: "html", ts: "babel-ts", tsx: "babel-ts",
    };
    const parser = parserMap[language] ?? "babel-ts";
    formattedCode = await prettier.format(code, {
      parser,
      semi: true,
      singleQuote: false,
      tabWidth: 2,
      trailingComma: "es5",
      printWidth: 100,
    });
  } catch {
    // Formatting failed — use raw extracted code
  }

  return {
    code: formattedCode,
    language,
    warnings: [...importResult.warnings, ...themeWarnings],
    importWarnings: importResult.warnings,
    themeWarnings,
  };
}
