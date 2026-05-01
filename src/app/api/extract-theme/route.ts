import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/ollama";
import { z } from "zod";

const ExtractThemeSchema = z.object({
  imageBase64: z.string().min(1),
  model: z.string().min(1),
});

const EXTRACTION_PROMPT = `Analyze this website screenshot and extract the color palette.
Return a JSON array of colors with their semantic roles.

Rules:
- Extract 5-10 distinct colors that define the site's visual identity.
- Assign each color a role: "primary", "secondary", "accent", "background", "text", "surface", "border", "success", "warning", "error", or "info".
- Use exact hex values (e.g., "#693FBD").
- Order by visual prominence (most dominant first).

Return ONLY valid JSON in this exact format, no other text:
[
  { "hex": "#693FBD", "role": "primary", "order": 0 },
  { "hex": "#F8F0FF", "role": "secondary", "order": 1 },
  { "hex": "#FF9F66", "role": "accent", "order": 2 }
]`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ExtractThemeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { imageBase64, model } = parsed.data;

  try {
    const response = await analyzeImage(model, EXTRACTION_PROMPT, imageBase64);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse color extraction result", raw: response },
        { status: 422 }
      );
    }
    const colors = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ colors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
