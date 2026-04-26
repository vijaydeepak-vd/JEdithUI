import type { PaletteColor, SlideTheme } from "@/types";
import { buildMarpTheme } from "./theme-injector";

/**
 * Inject front matter and a custom CSS theme into a Marp markdown string,
 * then return the fully-styled markdown ready for Marp to render.
 */
export function prepareMarpMarkdown(
  markdown: string,
  palette: PaletteColor[],
  theme: SlideTheme = "default"
): string {
  const themeName = `jedith-${theme}`;
  const themeCSS = buildMarpTheme(palette, theme);

  // Remove existing front matter if any
  let body = markdown.trim();
  if (body.startsWith("---")) {
    const end = body.indexOf("---", 3);
    if (end !== -1) {
      body = body.slice(end + 3).trim();
    }
  }

  // Build front matter with embedded style
  const frontMatter = `---
marp: true
theme: ${themeName}
paginate: true
style: |
${themeCSS
  .split("\n")
  .map((l) => `  ${l}`)
  .join("\n")}
---`;

  return `${frontMatter}\n\n${body}`;
}

/**
 * Count slides in markdown (sections separated by ---).
 */
export function countSlides(markdown: string): number {
  const withoutFrontMatter = markdown.replace(/^---[\s\S]*?---\n/, "");
  const dividers = withoutFrontMatter.match(/^---$/gm) || [];
  return dividers.length + 1;
}

/**
 * Build a simple HTML preview of the first slide from Marp markdown.
 * Full Marp rendering happens server-side via the preview API.
 */
export function buildSimpleSlidePreview(markdown: string): string {
  const withoutFrontMatter = markdown.replace(/^---[\s\S]*?---\n/, "");
  const firstSlide = withoutFrontMatter.split(/^---$/m)[0].trim();

  // Very basic markdown → HTML conversion for preview
  const html = firstSlide
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^([^<\n].+)$/gm, "<p>$1</p>");

  return html;
}
