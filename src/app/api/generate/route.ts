import { NextRequest, NextResponse } from "next/server";
import { generateCode } from "@/lib/ai/generate-code";
import { z } from "zod";
import type { UILibrary, Framework, PaletteColor } from "@/types";

/**
 * POST /api/generate  (STATELESS)
 *
 * Accepts all context from the client (palette, framework, libraries, etc.)
 * and returns generated code. No database reads or writes — the client
 * manages persistence in IndexedDB via Dexie.
 */
const GenerateSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().min(1),
  palette: z.array(
    z.object({ hex: z.string(), role: z.string(), order: z.number() })
  ),
  libraries: z.array(z.string()).default([]),
  framework: z.enum(["REACT", "VUE", "SVELTE", "ANGULAR", "HTML"]).default("REACT"),
  existingCode: z.string().optional(),
  imageBase64: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { prompt, model, palette, libraries, framework, existingCode, imageBase64 } =
    parsed.data;

  try {
    const result = await generateCode({
      prompt,
      model,
      palette: palette as PaletteColor[],
      libraries: libraries as UILibrary[],
      framework: framework as Framework,
      existingCode,
      imageBase64,
    });

    return NextResponse.json({
      code: result.code,
      language: result.language,
      warnings: result.warnings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
