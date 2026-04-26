import type { PaletteColor, SlideTheme, ExportFormat } from "@/types";
import { prepareMarpMarkdown } from "./marp-preview";
import path from "path";
import os from "os";
import fs from "fs/promises";

/**
 * Export Marp markdown to PPTX, PDF, or HTML using Marp CLI.
 * Returns a Buffer of the exported file.
 */
export async function exportMarpSlides(
  markdown: string,
  format: ExportFormat,
  palette: PaletteColor[],
  theme: SlideTheme = "default"
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  const styledMarkdown = prepareMarpMarkdown(markdown, palette, theme);

  // Write markdown to temp file
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "jedith-marp-"));
  const mdPath = path.join(tmpDir, "slides.md");
  const outExt = format === "html" ? "html" : format;
  const outPath = path.join(tmpDir, `slides.${outExt}`);

  await fs.writeFile(mdPath, styledMarkdown, "utf-8");

  // Dynamic import to avoid SSR issues
  const { Marp } = await import("@marp-team/marp-core");

  if (format === "html") {
    // Generate HTML directly with Marp core
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
    await fs.writeFile(outPath, fullHtml, "utf-8");
    const buffer = await fs.readFile(outPath);
    await fs.rm(tmpDir, { recursive: true, force: true });
    return { buffer, mimeType: "text/html", filename: "presentation.html" };
  }

  // For PPTX / PDF — use Marp CLI
  try {
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);

    // Use the .js entry directly with the current node binary (process.execPath)
    // to avoid shebang issues when `node` isn't on PATH (nvm environments).
    const marpCliJs = path.resolve(
      process.cwd(),
      "node_modules/@marp-team/marp-cli/marp-cli.js"
    );

    const args = [
      marpCliJs,
      "--no-stdin",
      mdPath,
      "--output",
      outPath,
      "--allow-local-files",
    ];

    if (format === "pptx") args.push("--pptx");
    if (format === "pdf") args.push("--pdf");

    // Pass CHROME_PATH so Marp CLI can find the browser for rendering
    const env = {
      ...process.env,
      CHROME_PATH:
        process.env.CHROME_PATH ||
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    };

    await execFileAsync(process.execPath, args, { timeout: 60000, env });

    const buffer = await fs.readFile(outPath);
    await fs.rm(tmpDir, { recursive: true, force: true });

    const mimeTypes: Record<ExportFormat, string> = {
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      pdf: "application/pdf",
      html: "text/html",
    };

    return {
      buffer,
      mimeType: mimeTypes[format],
      filename: `presentation.${format}`,
    };
  } catch (error) {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(
      `Marp export failed: ${error instanceof Error ? error.message : "Unknown error"}. ` +
        "Make sure Marp CLI is installed (npm install @marp-team/marp-cli)."
    );
  }
}
