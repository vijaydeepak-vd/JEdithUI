import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreatePaletteSchema = z.object({
  name: z.string().min(1).max(100),
  source: z.enum(["IMAGE", "CSS", "MANUAL"]),
  colors: z
    .array(
      z.object({
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        role: z.string(),
        order: z.number().int().min(0),
      })
    )
    .min(1)
    .max(20),
  sessionId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId)
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { sessionId },
    include: {
      palettes: {
        include: { colors: { orderBy: { order: "asc" } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return NextResponse.json({ palettes: user?.palettes || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreatePaletteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, source, colors, sessionId } = parsed.data;

  const user = await prisma.user.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {},
  });

  const palette = await prisma.palette.create({
    data: {
      name,
      source,
      userId: user.id,
      colors: {
        create: colors.map((c) => ({
          hex: c.hex,
          role: c.role,
          order: c.order,
        })),
      },
    },
    include: { colors: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ palette }, { status: 201 });
}
