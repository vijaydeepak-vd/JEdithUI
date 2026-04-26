import type { PaletteColor, UILibrary } from "@/types";
import { buildCdnTags } from "../cdn-manager";

/**
 * HTML preview wrapper — direct render with palette CSS vars.
 */
export function buildHtmlWrapper(
  code: string,
  palette: PaletteColor[],
  libraries: UILibrary[]
): string {
  const paletteCSS = palette.map((c) => `--color-${c.role}: ${c.hex};`).join("\n      ");
  const cdnTags = buildCdnTags(libraries, "html");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JEdithUI Preview</title>
  ${cdnTags}
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    :root {
      ${paletteCSS}
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
}
