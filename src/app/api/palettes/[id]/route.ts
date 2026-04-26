import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const palette = await prisma.palette.findUnique({
    where: { id },
    include: { colors: { orderBy: { order: "asc" } } },
  });
  if (!palette)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ palette });
}

const UpdatePaletteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  colors: z
    .array(
      z.object({
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        role: z.string(),
        order: z.number().int().min(0),
      })
    )
    .optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdatePaletteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, colors } = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;

  if (colors) {
    await prisma.color.deleteMany({ where: { paletteId: id } });
    await prisma.color.createMany({
      data: colors.map((c) => ({ ...c, paletteId: id })),
    });
  }

  const palette = await prisma.palette.update({
    where: { id },
    data: updateData,
    include: { colors: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ palette });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.palette.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
