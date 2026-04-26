import type { PaletteColor, UILibrary, Framework } from "@/types";
import { buildReactWrapper } from "./wrappers/react-wrapper";
import { buildHtmlWrapper } from "./wrappers/html-wrapper";

/**
 * Preview orchestrator — picks the right wrapper based on framework.
 */
export function buildPreviewHtml(
  code: string,
  framework: Framework,
  libraries: UILibrary[],
  palette: PaletteColor[]
): string {
  switch (framework) {
    case "REACT":
      return buildReactWrapper(code, palette, libraries);
    case "HTML":
      return buildHtmlWrapper(code, palette, libraries);
    default:
      // For Vue/Svelte/Angular (Phase 3) — fall back to React wrapper
      return buildReactWrapper(code, palette, libraries);
  }
}
