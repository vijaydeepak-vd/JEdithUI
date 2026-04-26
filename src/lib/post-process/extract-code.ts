/**
 * Strip markdown fences from AI output and extract pure code.
 */
export function extractCode(raw: string): string {
  // Match ```tsx, ```jsx, ```html, ```vue, ```svelte, ```
  const fenceMatch = raw.match(/```(?:tsx?|jsx?|html|vue|svelte|javascript|typescript)?\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // No fences — return raw trimmed
  return raw.trim();
}

/**
 * Detect the language from the code fence or content.
 */
export function detectLanguage(raw: string, defaultLang = "tsx"): string {
  const match = raw.match(/```(tsx?|jsx?|html|vue|svelte)/);
  if (match) return match[1];
  return defaultLang;
}
