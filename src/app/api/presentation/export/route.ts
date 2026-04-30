import { NextRequest, NextResponse } from "next/server";
import { exportMarpSlides } from "@/lib/marp/marp-export";
import { z } from "zod";
import type { PaletteColor, SlideTheme, ExportFormat } from "@/types";

const Schema = z.object({
  markdown: z.string().min(1),
  format: z.enum(["pptx", "pdf", "html"]),
  palette: z.array(
    z.object({ hex: z.string(), role: z.string(), order: z.number() })
  ),
  theme: z.string().optional().default("default"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { markdown, format, palette, theme } = parsed.data;

  try {
    const { buffer, mimeType, filename } = await exportMarpSlides(
      markdown,
      format as ExportFormat,
      palette as PaletteColor[],
      theme as SlideTheme
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
