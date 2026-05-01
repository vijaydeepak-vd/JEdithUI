import PptxGenJS from "pptxgenjs";
import type { SlideBlock, ThemeColors } from "./pptx-types";
import { hex } from "./pptx-types";

// ─── Block Renderers ──────────────────────────────────

export function addHeading(
  slide: PptxGenJS.Slide,
  block: SlideBlock,
  y: number,
  x: number,
  w: number,
  colors: ThemeColors,
  isTitleSlide: boolean,
  isDark: boolean
): number {
  const level = block.level ?? 1;
  const fontSize = level === 1 ? 32 : level === 2 ? 24 : 20;
  const fontColor = isTitleSlide
    ? "FFFFFF"
    : isDark
      ? hex(colors.accent)
      : hex(colors.primary);

  const h = level === 1 ? 1.0 : 0.7;

  slide.addText(block.text ?? "", {
    x, y, w, h,
    fontSize,
    fontFace: "Arial",
    color: fontColor,
    bold: true,
    align: isTitleSlide ? "center" : "left",
    valign: "bottom",
  });

  if (level === 1 && !isTitleSlide) {
    slide.addShape("rect" as PptxGenJS.ShapeType, {
      x, y: y + h + 0.05, w: 1.2, h: 0.05,
      fill: { color: hex(colors.accent) },
    });
    return y + h + 0.25;
  }

  return y + h + 0.1;
}

export function addBullets(
  slide: PptxGenJS.Slide,
  block: SlideBlock,
  y: number,
  x: number,
  w: number,
  colors: ThemeColors,
  isTitleSlide: boolean,
  isDark: boolean
): number {
  const items = block.items ?? [];
  const textColor = isTitleSlide ? "FFFFFF" : isDark ? "E0E0E0" : hex(colors.text);
  const bulletColor = hex(colors.accent);
  const lineHeight = 0.38;
  const h = Math.max(items.length * lineHeight, 0.5);

  const textRows = items.map((item) => ({
    text: item,
    options: {
      fontSize: 16,
      fontFace: "Arial" as const,
      color: textColor,
      bullet: { color: bulletColor, indent: 14 },
      paraSpaceAfter: 6,
    },
  }));

  slide.addText(textRows, { x, y, w, h, valign: "top" as const });
  return y + h + 0.15;
}

export function addCodeBlock(
  slide: PptxGenJS.Slide,
  block: SlideBlock,
  y: number,
  x: number,
  w: number,
): number {
  const code = block.text ?? "";
  const lineCount = code.split("\n").length;
  const h = Math.min(Math.max(lineCount * 0.25, 0.6), 3.5);

  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x, y, w, h,
    fill: { color: "0F111A" },
    rectRadius: 0.08,
  });

  slide.addText(code, {
    x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2,
    fontSize: 11,
    fontFace: "Courier New",
    color: "E0E0E0",
    valign: "top",
    wrap: true,
  });

  return y + h + 0.2;
}

export function addParagraph(
  slide: PptxGenJS.Slide,
  block: SlideBlock,
  y: number,
  x: number,
  w: number,
  colors: ThemeColors,
  isTitleSlide: boolean,
  isDark: boolean
): number {
  const text = block.text ?? "";
  const fontSize = isTitleSlide ? 18 : 15;
  const textColor = isTitleSlide
    ? "FFFFFFCC"
    : isDark
      ? "C0C0C0"
      : hex(colors.text);

  const lineEstimate = Math.ceil(text.length / 90);
  const h = Math.max(lineEstimate * 0.35, 0.5);

  slide.addText(text, {
    x, y, w, h,
    fontSize,
    fontFace: "Arial",
    color: textColor,
    align: isTitleSlide ? "center" : "left",
    valign: "top",
    wrap: true,
    lineSpacingMultiple: 1.3,
  });

  return y + h + 0.1;
}

export function addTable(
  slide: PptxGenJS.Slide,
  block: SlideBlock,
  y: number,
  x: number,
  colors: ThemeColors
): number {
  const rows = block.rows ?? [];
  if (rows.length === 0) return y;

  const tableRows: PptxGenJS.TableRow[] = rows.map((cells, rowIdx) => {
    const isHeader = rowIdx === 0;
    return cells.map((cell) => ({
      text: cell,
      options: {
        fontSize: 12,
        fontFace: "Arial" as const,
        bold: isHeader,
        color: isHeader ? "FFFFFF" : hex(colors.text),
        fill: { color: isHeader ? hex(colors.primary) : "FFFFFF" },
        border: [
          { type: "solid" as const, pt: 0.5, color: hex(colors.surface) },
          { type: "solid" as const, pt: 0.5, color: hex(colors.surface) },
          { type: "solid" as const, pt: 0.5, color: hex(colors.surface) },
          { type: "solid" as const, pt: 0.5, color: hex(colors.surface) },
        ],
        valign: "middle" as const,
        align: "left" as const,
        margin: [4, 6, 4, 6] as [number, number, number, number],
      },
    }));
  });

  const colW = (11.73 - x * 2) / (rows[0]?.length ?? 1);
  const h = rows.length * 0.35;

  slide.addTable(tableRows, {
    x, y, w: 11.73 - x * 2,
    colW,
    autoPage: false,
  });

  return y + h + 0.2;
}
