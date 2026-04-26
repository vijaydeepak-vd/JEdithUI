import type { PaletteColor } from "@/types";

/**
 * Scan generated code for hardcoded hex colors not in the palette.
 * Returns warnings for non-palette colors.
 */
export function checkThemeCompliance(
  code: string,
  palette: PaletteColor[]
): string[] {
  const paletteHexes = new Set(
    palette.map((c) => c.hex.toLowerCase())
  );

  // Find all hex colors in code
  const hexMatches = code.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const uniqueHexes = [...new Set(hexMatches.map((h) => h.toLowerCase()))];

  const warnings: string[] = [];
  for (const hex of uniqueHexes) {
    if (!paletteHexes.has(hex)) {
      warnings.push(
        `Hardcoded color ${hex} is not in the active palette. Use palette colors instead.`
      );
    }
  }

  return warnings;
}
