import type { PaletteColor, SlideTheme } from "@/types";
import PptxGenJS from "pptxgenjs";
import { extractColors, hex } from "./pptx-types";
import type { ParsedSlide, ThemeColors } from "./pptx-types";
import { splitSlides, parseSlide } from "./pptx-parser";
import {
  addHeading,
  addBullets,
  addCodeBlock,
  addParagraph,
  addTable,
} from "./pptx-renderers";

/**
 * Build a PPTX buffer from Marp markdown + palette colors.
 * Uses pptxgenjs — pure JS, no Chrome required,
 * works on Vercel serverless.
 */
export async function buildPptx(
  markdown: string,
  palette: PaletteColor[],
  theme: SlideTheme = "default"
): Promise<Buffer> {
  const colors = extractColors(palette);
  const slides = splitSlides(markdown);
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "JEdithUI";
  pptx.subject = "AI-Generated Presentation";

  for (const raw of slides) {
    const parsed = parseSlide(raw);
    renderSlide(pptx, parsed, colors, theme);
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}

/** Add a single parsed slide to the presentation. */
function renderSlide(
  pptx: PptxGenJS,
  parsed: ParsedSlide,
  colors: ThemeColors,
  theme: SlideTheme
): void {
  const slide = pptx.addSlide();
  const isDark = theme === "dark";
  const isTitleSlide = parsed.isTitle;

  // ── Slide background ──
  if (isTitleSlide) {
    slide.background = { color: hex(colors.primary) };
  } else if (isDark) {
    slide.background = { color: "1a1a2e" };
  } else {
    slide.background = { color: hex(colors.background) };
  }

  // ── Accent bar at top ──
  if (!isTitleSlide) {
    slide.addShape("rect" as PptxGenJS.ShapeType, {
      x: 0, y: 0, w: "100%", h: 0.06,
      fill: { color: hex(colors.accent) },
    });
  }

  // ── Render blocks ──
  let yPos = isTitleSlide ? 1.8 : 0.5;
  const xMargin = 0.8;
  const contentWidth = 11.73 - xMargin * 2;

  for (const block of parsed.blocks) {
    switch (block.type) {
      case "heading":
        yPos = addHeading(slide, block, yPos, xMargin, contentWidth, colors, isTitleSlide, isDark);
        break;
      case "bullets":
        yPos = addBullets(slide, block, yPos, xMargin, contentWidth, colors, isTitleSlide, isDark);
        break;
      case "code":
        yPos = addCodeBlock(slide, block, yPos, xMargin, contentWidth);
        break;
      case "paragraph":
        yPos = addParagraph(slide, block, yPos, xMargin, contentWidth, colors, isTitleSlide, isDark);
        break;
      case "table":
        yPos = addTable(slide, block, yPos, xMargin, colors);
        break;
      default:
        break;
    }
  }

  // ── Page number ──
  slide.slideNumber = {
    x: 11.0, y: 6.2, w: 0.6, h: 0.3,
    fontSize: 9,
    color: isTitleSlide ? "FFFFFF" : hex(colors.text) + "80",
    align: "right",
  };
}
