import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      palette: { include: { colors: { orderBy: { order: "asc" } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { codeVersion: true, slideVersion: true },
      },
    },
  });
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    chat: { ...chat, libraries: JSON.parse(chat.libraries) },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const allowedFields = ["name", "modelName", "framework", "slideTheme"];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }
  if (body.libraries) updateData.libraries = JSON.stringify(body.libraries);
  const chat = await prisma.chat.update({ where: { id }, data: updateData });
  return NextResponse.json({ chat });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.chat.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
