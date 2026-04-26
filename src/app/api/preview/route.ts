import { NextRequest, NextResponse } from "next/server";
import { buildPreviewHtml } from "@/lib/preview";
import { z } from "zod";
import type { Framework, UILibrary, PaletteColor } from "@/types";

const PreviewSchema = z.object({
  code: z.string().min(1),
  framework: z.enum(["REACT", "VUE", "SVELTE", "ANGULAR", "HTML"]),
  libraries: z.array(z.string()),
  palette: z.array(z.object({
    hex: z.string(),
    role: z.string(),
    order: z.number(),
  })),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { code, framework, libraries, palette } = parsed.data;

  try {
    const html = buildPreviewHtml(
      code,
      framework as Framework,
      libraries as UILibrary[],
      palette as PaletteColor[]
    );
    return NextResponse.json({ html });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview build failed" },
      { status: 500 }
    );
  }
}
