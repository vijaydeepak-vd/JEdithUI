import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const messages = await prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: "asc" },
    include: { codeVersion: true, slideVersion: true },
  });

  // Add hasImage flag and include imageBase64 for display
  const enriched = messages.map((m) => ({
    ...m,
    hasImage: !!m.imageBase64,
  }));

  return NextResponse.json({ messages: enriched });
}
