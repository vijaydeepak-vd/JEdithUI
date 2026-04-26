import { NextRequest, NextResponse } from "next/server";
import { parseOpenApiSpec } from "@/lib/parsers/swagger-parser";
import { prisma } from "@/lib/db";
import { z } from "zod";

const SwaggerSchema = z.object({
  specText: z.string().min(1),
  sessionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SwaggerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { specText, sessionId } = parsed.data;

  try {
    const result = parseOpenApiSpec(specText);

    // Upsert user
    const user = await prisma.user.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {},
    });

    // Save spec to DB
    const spec = await prisma.swaggerSpec.create({
      data: {
        name: result.name,
        version: result.version,
        specJson: specText,
        userId: user.id,
        endpoints: {
          create: result.endpoints.map((ep) => ({
            method: ep.method,
            path: ep.path,
            summary: ep.summary,
            suggestedUI: ep.suggestedUI,
            requestSchema: ep.requestSchema ? JSON.stringify(ep.requestSchema) : null,
            responseSchema: ep.responseSchema ? JSON.stringify(ep.responseSchema) : null,
          })),
        },
      },
      include: { endpoints: true },
    });

    return NextResponse.json({ spec, parsed: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse spec" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { sessionId } });
  if (!user) return NextResponse.json({ specs: [] });

  const specs = await prisma.swaggerSpec.findMany({
    where: { userId: user.id },
    include: { endpoints: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ specs });
}
