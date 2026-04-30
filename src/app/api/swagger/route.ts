import { NextRequest, NextResponse } from "next/server";
import { parseOpenApiSpec } from "@/lib/parsers/swagger-parser";
import { z } from "zod";

/**
 * POST /api/swagger  (STATELESS)
 *
 * Parses an OpenAPI spec and returns the structured result.
 * No database reads or writes — the client stores results in IndexedDB if needed.
 */
const SwaggerSchema = z.object({
  specText: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SwaggerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { specText } = parsed.data;

  try {
    const result = parseOpenApiSpec(specText);
    return NextResponse.json({ parsed: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse spec" },
      { status: 500 }
    );
  }
}
