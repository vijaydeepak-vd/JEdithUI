/**
 * Generates `references/theme.md` — a complete design token reference
 * from a JEdithUI palette. Includes CSS variables, Tailwind config,
 * MUI theme, and raw hex table.
 */
import type { PaletteColor, UILibrary } from "@/types";

export function buildThemeMarkdown(
  paletteName: string,
  colors: PaletteColor[],
  libraries: UILibrary[]
): string {
  const colorTable = buildColorTable(colors);
  const cssVars = buildCSSVariables(colors);
  const tailwindConfig = buildTailwindConfig(colors);
  const librarySections = buildLibrarySections(colors, libraries);

  return `# Theme: ${paletteName}

This file defines the **${paletteName}** design palette. Apply these colors consistently to every UI element you generate.

## CRITICAL RULES
1. **NEVER** hardcode colors outside this palette.
2. Use CSS custom properties or framework tokens — not raw hex values in components.
3. Ensure contrast ratios meet WCAG AA (4.5:1 for text, 3:1 for large text/UI).
4. When the design calls for a shade not listed, derive it from the nearest palette color (lighten/darken by 10-20%).

---

## Color Palette

${colorTable}

---

## CSS Custom Properties

\`\`\`css
:root {
${cssVars}
}
\`\`\`

### Usage in CSS
\`\`\`css
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text);
}
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
}
\`\`\`

---

## Tailwind CSS Configuration

Add to \`tailwind.config.js\` or \`tailwind.config.ts\`:

\`\`\`js
module.exports = {
  theme: {
    extend: {
      colors: {
${tailwindConfig}
      },
    },
  },
};
\`\`\`

### Usage in Tailwind
\`\`\`html
<button class="bg-primary text-text hover:bg-primary/90">Click me</button>
<div class="bg-surface border border-border rounded-lg p-4">Card</div>
\`\`\`

---

## Inline Styles (HTML-only / No Framework)

When generating a standalone HTML file with no build tools, embed the palette directly:

\`\`\`html
<style>
  :root {
${cssVars}
  }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    background-color: var(--color-background);
    color: var(--color-text);
  }
</style>
\`\`\`

${librarySections}
---

## Semantic Usage Guide

| Role | When to Use |
|------|-------------|
| \`primary\` | Buttons, headers, primary CTAs, active states |
| \`secondary\` | Secondary buttons, subheadings, supporting UI |
| \`accent\` | Highlights, badges, notifications, focus rings |
| \`background\` | Page/app background |
| \`surface\` | Cards, modals, panels, elevated containers |
| \`text\` | Body text, headings, labels |
| \`border\` | Dividers, card borders, input outlines |
| \`success\` | Success messages, confirmations, positive indicators |
| \`warning\` | Warning banners, caution states |
| \`error\` | Error messages, destructive actions, validation errors |
| \`info\` | Informational banners, tooltips, help text |
`;
}

// ── Helpers ──────────────────────────────────────────

function buildColorTable(colors: PaletteColor[]): string {
  const rows = colors
    .map(
      (c) =>
        `| ${c.role} | \`${c.hex}\` | ![](https://via.placeholder.com/20/${c.hex.replace("#", "")}/${c.hex.replace("#", "")}?text=+) |`
    )
    .join("\n");

  return `| Role | Hex | Preview |
|------|-----|---------|
${rows}`;
}

function buildCSSVariables(colors: PaletteColor[]): string {
  return colors
    .map((c) => `  --color-${c.role}: ${c.hex};`)
    .join("\n");
}

function buildTailwindConfig(colors: PaletteColor[]): string {
  return colors
    .map((c) => `        "${c.role}": "${c.hex}",`)
    .join("\n");
}

function buildLibrarySections(
  colors: PaletteColor[],
  libraries: UILibrary[]
): string {
  const sections: string[] = [];

  if (libraries.includes("mui")) {
    sections.push(buildMUISection(colors));
  }
  if (libraries.includes("chakra")) {
    sections.push(buildChakraSection(colors));
  }
  if (libraries.includes("antd")) {
    sections.push(buildAntdSection(colors));
  }
  if (libraries.includes("mantine")) {
    sections.push(buildMantineSection(colors));
  }

  return sections.length > 0 ? sections.join("\n\n") + "\n\n" : "";
}

function findColor(colors: PaletteColor[], role: string): string {
  return colors.find((c) => c.role === role)?.hex ?? "#000000";
}

function buildMUISection(colors: PaletteColor[]): string {
  return `## Material UI (MUI) Theme

\`\`\`tsx
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "${findColor(colors, "primary")}" },
    secondary: { main: "${findColor(colors, "secondary")}" },
    error: { main: "${findColor(colors, "error")}" },
    warning: { main: "${findColor(colors, "warning")}" },
    info: { main: "${findColor(colors, "info")}" },
    success: { main: "${findColor(colors, "success")}" },
    background: {
      default: "${findColor(colors, "background")}",
      paper: "${findColor(colors, "surface")}",
    },
    text: { primary: "${findColor(colors, "text")}" },
  },
});
\`\`\``;
}

function buildChakraSection(colors: PaletteColor[]): string {
  return `## Chakra UI Theme

\`\`\`tsx
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    brand: {
      500: "${findColor(colors, "primary")}",
      600: "${findColor(colors, "secondary")}",
    },
    accent: { 500: "${findColor(colors, "accent")}" },
  },
  styles: {
    global: {
      body: {
        bg: "${findColor(colors, "background")}",
        color: "${findColor(colors, "text")}",
      },
    },
  },
});
\`\`\``;
}

function buildAntdSection(colors: PaletteColor[]): string {
  return `## Ant Design Theme

\`\`\`tsx
import { ConfigProvider } from "antd";

<ConfigProvider
  theme={{
    token: {
      colorPrimary: "${findColor(colors, "primary")}",
      colorSuccess: "${findColor(colors, "success")}",
      colorWarning: "${findColor(colors, "warning")}",
      colorError: "${findColor(colors, "error")}",
      colorInfo: "${findColor(colors, "info")}",
      colorBgBase: "${findColor(colors, "background")}",
      colorTextBase: "${findColor(colors, "text")}",
      colorBorder: "${findColor(colors, "border")}",
    },
  }}
>
  {children}
</ConfigProvider>
\`\`\``;
}

function buildMantineSection(colors: PaletteColor[]): string {
  return `## Mantine Theme

\`\`\`tsx
import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({
  primaryColor: "brand",
  colors: {
    brand: [
      "${findColor(colors, "surface")}",   // 0
      "${findColor(colors, "border")}",    // 1
      "${findColor(colors, "secondary")}", // 2
      "${findColor(colors, "secondary")}", // 3
      "${findColor(colors, "primary")}",   // 4
      "${findColor(colors, "primary")}",   // 5
      "${findColor(colors, "primary")}",   // 6
      "${findColor(colors, "accent")}",    // 7
      "${findColor(colors, "accent")}",    // 8
      "${findColor(colors, "accent")}",    // 9
    ],
  },
});
\`\`\``;
}
