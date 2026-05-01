import type { PaletteColor, SlideTheme, ExportFormat } from "@/types";
import { prepareMarpMarkdown } from "./marp-preview";
import { buildPptx } from "./pptx-builder";

/**
 * Export Marp markdown to PPTX or HTML.
 *
 * - **PPTX**: Built with pptxgenjs — pure JS, no Chrome required,
 *   works on Vercel serverless. Produces editable slides with palette theming.
 * - **HTML**: Rendered with @marp-team/marp-core for pixel-perfect output.
 * - **PDF**: Not currently supported (needs headless Chrome).
 */
export async function exportMarpSlides(
  markdown: string,
  format: ExportFormat,
  palette: PaletteColor[],
  theme: SlideTheme = "default"
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  if (format === "pptx") {
    const buffer = await buildPptx(markdown, palette, theme);
    return {
      buffer,
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      filename: "presentation.pptx",
    };
  }

  if (format === "pdf") {
    throw new Error(
      "PDF export is not available in this environment. " +
        "Please use PPTX or HTML export instead."
    );
  }

  // HTML export via Marp Core
  const styledMarkdown = prepareMarpMarkdown(markdown, palette, theme);
  const { Marp } = await import("@marp-team/marp-core");

  const marp = new Marp({ html: true });
  const { html, css } = marp.render(styledMarkdown);

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JEdithUI Presentation</title>
  <style>${css}</style>
</head>
<body>
  <div class="marp">
    ${html}
  </div>
</body>
</html>`;

  const buffer = Buffer.from(fullHtml, "utf-8");
  return { buffer, mimeType: "text/html", filename: "presentation.html" };
}
