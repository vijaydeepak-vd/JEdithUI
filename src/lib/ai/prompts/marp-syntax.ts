import type { PaletteColor, SlideTheme } from "@/types";

/**
 * Marp syntax rules + palette CSS injection for slide generation.
 */
export function buildMarpContext(
  colors: PaletteColor[],
  slideTheme: SlideTheme
): string {
  const colorMap = Object.fromEntries(colors.map((c) => [c.role, c.hex]));

  return `## Marp Slide Generation Context

### Selected Theme: ${slideTheme}

### Palette CSS Variables (inject in frontmatter style block)
\`\`\`css
<style>
:root {
  --color-primary: ${colorMap.primary || "#344620"};
  --color-secondary: ${colorMap.secondary || "#eaeedd"};
  --color-accent: ${colorMap.accent || "#d57a2a"};
  --color-bg: ${colorMap.background || "#FFFFFF"};
  --color-text: ${colorMap.text || "#363636"};
  --color-surface: ${colorMap.surface || "#F5F5F5"};
}
section {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, sans-serif;
}
h1, h2 { color: var(--color-primary); }
strong { color: var(--color-accent); }
section.title {
  background: var(--color-primary);
  color: white;
}
section.title h1 { color: white; }
</style>
\`\`\`

### Slide Layout Best Practices
- **Title slide**: Use \`<!-- _class: title -->\` — large heading, subtitle, presenter
- **Content slides**: Max 5 bullets, keep each under 12 words
- **Two-column**: Use HTML table or Marp split syntax
- **Quote slides**: Use blockquote \`>\` for emphasis
- **Closing slide**: Call-to-action or summary

### Example Slide Structure
\`\`\`
---
marp: true
theme: jedith
paginate: true
---

<style>
/* paste palette CSS here */
</style>

<!-- _class: title -->
# Presentation Title
## Subtitle here

---

# Slide 2 Title

- Bullet point one
- Bullet point two
- Bullet point three

---
\`\`\``;
}
