import type { PaletteColor, ColorRole } from "@/types";

/**
 * Parse raw CSS and extract color values with role assignments.
 * Handles: CSS custom properties (--var), hex colors, rgb(), hsl().
 */
export function parseCssToColors(css: string): PaletteColor[] {
  const colorMap = new Map<string, string>(); // varName/role → hex

  // Extract CSS custom properties with color values
  const varPattern = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\))/g;
  let match;
  while ((match = varPattern.exec(css)) !== null) {
    const varName = match[1].toLowerCase();
    const colorValue = match[2];
    const hex = toHex(colorValue);
    if (hex) colorMap.set(varName, hex);
  }

  // Assign semantic roles based on variable name patterns
  const colors: PaletteColor[] = [];
  const usedRoles = new Set<string>();
  let order = 0;

  for (const [varName, hex] of colorMap) {
    const role = inferRole(varName, usedRoles);
    usedRoles.add(role);
    colors.push({ hex, role: role as ColorRole, order: order++ });
    if (order >= 12) break; // Max 12 colors
  }

  // If no CSS vars found, scan for bare hex colors
  if (colors.length === 0) {
    const hexPattern = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    const hexSet = new Set<string>();
    while ((match = hexPattern.exec(css)) !== null) {
      hexSet.add(normalizeHex(match[0]));
    }
    for (const hex of hexSet) {
      const role = inferRole("", usedRoles);
      usedRoles.add(role);
      colors.push({ hex, role: role as ColorRole, order: order++ });
      if (order >= 10) break;
    }
  }

  return colors;
}

function inferRole(varName: string, used: Set<string>): string {
  const rolePatterns: [RegExp, string][] = [
    [/primary|brand|main/, "primary"],
    [/secondary|sub/, "secondary"],
    [/accent|highlight|focus|cta/, "accent"],
    [/bg|background|back/, "background"],
    [/text|fore|font|content/, "text"],
    [/surface|card|panel/, "surface"],
    [/border|divider|line/, "border"],
    [/success|green|positive/, "success"],
    [/warn|orange|caution/, "warning"],
    [/error|danger|red|negative/, "error"],
    [/info|blue|notice/, "info"],
  ];

  for (const [pattern, role] of rolePatterns) {
    if (pattern.test(varName) && !used.has(role)) return role;
  }

  // Fallback to first unused role
  const allRoles = ["primary", "secondary", "accent", "background", "text", "surface", "border", "info"];
  for (const r of allRoles) {
    if (!used.has(r)) return r;
  }
  return `color-${used.size}`;
}

function toHex(color: string): string | null {
  if (color.startsWith("#")) return normalizeHex(color);
  if (color.startsWith("rgb")) return rgbToHex(color);
  return null;
}

function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    // #abc → #aabbcc
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex.slice(0, 7).toLowerCase();
}

function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) return null;
  const [r, g, b] = match.map((n) => Math.round(parseFloat(n)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
