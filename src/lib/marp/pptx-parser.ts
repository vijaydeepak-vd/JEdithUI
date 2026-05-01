import type { SlideBlock, ParsedSlide } from "./pptx-types";

// ─── Markdown Parser ──────────────────────────────────

/** Strip Marp front matter and split into slide sections. */
export function splitSlides(markdown: string): string[] {
  let body = markdown.trim();
  if (body.startsWith("---")) {
    const end = body.indexOf("---", 3);
    if (end !== -1) body = body.slice(end + 3).trim();
  }
  return body.split(/^---$/m).map((s) => s.trim()).filter(Boolean);
}

/** Parse a single slide's markdown into structured blocks. */
export function parseSlide(raw: string): ParsedSlide {
  const lines = raw.split("\n");
  const blocks: SlideBlock[] = [];
  const directives: string[] = [];
  let isTitle = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Marp directives: <!-- class: title -->
    const directiveMatch = line.match(/<!--\s*(.*?)\s*-->/);
    if (directiveMatch) {
      const dir = directiveMatch[1].trim();
      directives.push(dir);
      if (dir.includes("title") || dir.includes("invert")) isTitle = true;
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (level === 1 && blocks.length === 0) isTitle = true;
      blocks.push({ type: "heading", level, text: cleanInline(headingMatch[2]) });
      i++;
      continue;
    }

    // Code block
    if (line.match(/^```/)) {
      i = parseCodeBlock(lines, i, blocks);
      continue;
    }

    // Bullet list
    if (line.match(/^\s*[-*]\s+/)) {
      i = parseBulletList(lines, i, blocks);
      continue;
    }

    // Numbered list → treat as bullets
    if (line.match(/^\s*\d+\.\s+/)) {
      i = parseNumberedList(lines, i, blocks);
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].match(/^\|?\s*[-:]+/)) {
      i = parseTable(lines, i, blocks);
      continue;
    }

    // Image: ![alt](src)
    const imgMatch = line.match(/!\[.*?\]\((.+?)\)/);
    if (imgMatch) {
      blocks.push({ type: "image", src: imgMatch[1] });
      i++;
      continue;
    }

    // Paragraph
    if (line.trim().length > 0) {
      i = parseParagraph(lines, i, blocks);
      continue;
    }

    i++;
  }

  return { blocks, directives, isTitle };
}

// ─── Sub-parsers ──────────────────────────────────────

function parseCodeBlock(lines: string[], i: number, blocks: SlideBlock[]): number {
  const codeLines: string[] = [];
  i++;
  while (i < lines.length && !lines[i].match(/^```/)) {
    codeLines.push(lines[i]);
    i++;
  }
  blocks.push({ type: "code", text: codeLines.join("\n") });
  return i + 1;
}

function parseBulletList(lines: string[], i: number, blocks: SlideBlock[]): number {
  const items: string[] = [];
  while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
    items.push(cleanInline(lines[i].replace(/^\s*[-*]\s+/, "")));
    i++;
  }
  blocks.push({ type: "bullets", items });
  return i;
}

function parseNumberedList(lines: string[], i: number, blocks: SlideBlock[]): number {
  const items: string[] = [];
  while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
    items.push(cleanInline(lines[i].replace(/^\s*\d+\.\s+/, "")));
    i++;
  }
  blocks.push({ type: "bullets", items });
  return i;
}

function parseTable(lines: string[], i: number, blocks: SlideBlock[]): number {
  const rows: string[][] = [];
  while (i < lines.length && lines[i].includes("|")) {
    if (lines[i].match(/^\|?\s*[-:]+/)) { i++; continue; }
    const cells = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
    rows.push(cells);
    i++;
  }
  blocks.push({ type: "table", rows });
  return i;
}

function parseParagraph(lines: string[], i: number, blocks: SlideBlock[]): number {
  const paraLines: string[] = [];
  while (
    i < lines.length &&
    lines[i].trim().length > 0 &&
    !lines[i].match(/^#{1,3}\s/) &&
    !lines[i].match(/^```/) &&
    !lines[i].match(/^\s*[-*]\s+/) &&
    !lines[i].match(/^\s*\d+\.\s+/) &&
    !lines[i].match(/<!--/)
  ) {
    paraLines.push(lines[i]);
    i++;
  }
  blocks.push({ type: "paragraph", text: cleanInline(paraLines.join(" ")) });
  return i;
}

/** Strip bold/italic/code markdown inline syntax. */
function cleanInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .trim();
}
