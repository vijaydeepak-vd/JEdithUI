import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateChatSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["CODE", "PRESENTATION"]),
  framework: z.enum(["REACT", "VUE", "SVELTE", "ANGULAR", "HTML"]).optional(),
  libraries: z.array(z.string()).optional().default([]),
  slideTheme: z.string().optional(),
  modelName: z.string().min(1),
  paletteId: z.string().min(1),
  linkedChatId: z.string().optional(),
  sessionId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const type = req.nextUrl.searchParams.get("type");
  if (!sessionId)
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { sessionId } });
  if (!user) return NextResponse.json({ chats: [] });

  const where: Record<string, unknown> = { userId: user.id };
  if (type) where.type = type;

  const chats = await prisma.chat.findMany({
    where,
    include: {
      palette: { include: { colors: { orderBy: { order: "asc" } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { codeVersion: true, slideVersion: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const transformed = chats.map((chat) => {
    const lastMsg = chat.messages[0];
    const latestVersion =
      lastMsg?.codeVersion?.version || lastMsg?.slideVersion?.version || 0;
    return {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      framework: chat.framework,
      libraries: JSON.parse(chat.libraries),
      slideTheme: chat.slideTheme,
      modelName: chat.modelName,
      paletteId: chat.paletteId,
      palette: chat.palette,
      linkedChatId: chat.linkedChatId,
      messageCount: chat._count.messages,
      latestVersion,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({ chats: transformed });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateChatSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sessionId, libraries, ...chatData } = parsed.data;

  const user = await prisma.user.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {},
  });

  const chat = await prisma.chat.create({
    data: {
      ...chatData,
      libraries: JSON.stringify(libraries),
      userId: user.id,
    },
    include: {
      palette: { include: { colors: { orderBy: { order: "asc" } } } },
    },
  });

  return NextResponse.json({ chat }, { status: 201 });
}
