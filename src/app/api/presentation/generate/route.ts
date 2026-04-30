import { NextRequest, NextResponse } from "next/server";
import { generateSlides } from "@/lib/ai/generate-slides";
import { z } from "zod";
import type { PaletteColor, SlideTheme } from "@/types";

/**
 * POST /api/presentation/generate  (STATELESS)
 *
 * Accepts all context from the client and returns generated slide markdown.
 * No database reads or writes — the client manages persistence in IndexedDB.
 */
const GenerateSlidesSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().min(1),
  palette: z.array(
    z.object({ hex: z.string(), role: z.string(), order: z.number() })
  ),
  slideTheme: z.string().default("business"),
  existingMarkdown: z.string().optional(),
  fileContext: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateSlidesSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { prompt, model, palette, slideTheme, existingMarkdown, fileContext } = parsed.data;

  // Prepend file context to the prompt so the AI sees attached file contents
  const enrichedPrompt = fileContext ? `${fileContext}${prompt}` : prompt;

  try {
    const result = await generateSlides({
      prompt: enrichedPrompt,
      model,
      palette: palette as PaletteColor[],
      slideTheme: slideTheme as SlideTheme,
      existingMarkdown,
    });

    return NextResponse.json({
      markdown: result.markdown,
      slideCount: result.slideCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Slide generation failed" },
      { status: 500 }
    );
  }
}
