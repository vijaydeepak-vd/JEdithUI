import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlides } from "@/lib/ai/generate-slides";
import { generateChatName } from "@/lib/utils";
import { z } from "zod";
import type { PaletteColor, SlideTheme } from "@/types";

const GenerateSlidesSchema = z.object({
  chatId: z.string().min(1),
  prompt: z.string().min(1).max(10000),
  modelName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateSlidesSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { chatId, prompt, modelName } = parsed.data;

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      palette: { include: { colors: { orderBy: { order: "asc" } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { slideVersion: true },
      },
    },
  });

  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const model = modelName || chat.modelName;
  const palette = chat.palette.colors as PaletteColor[];
  const slideTheme = (chat.slideTheme || "business") as SlideTheme;
  const existingMarkdown = chat.messages[0]?.slideVersion?.markdown;

  if (chat.name === "Untitled Chat" || chat.name === "Untitled Presentation") {
    await prisma.chat.update({
      where: { id: chatId },
      data: { name: generateChatName(prompt) },
    });
  }

  const versionCount = await prisma.slideVersion.count({
    where: { message: { chatId } },
  });

  const userMessage = await prisma.message.create({
    data: { role: "USER", content: prompt, chatId },
  });

  try {
    const result = await generateSlides({ prompt, model, palette, slideTheme, existingMarkdown });

    const assistantMessage = await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: `Generated ${result.slideCount} slides.`,
        chatId,
        slideVersion: {
          create: {
            markdown: result.markdown,
            slideCount: result.slideCount,
            version: versionCount + 1,
            modelName: model,
          },
        },
      },
      include: { slideVersion: true },
    });

    await prisma.chat.update({ where: { id: chatId }, data: { modelName: model } });

    return NextResponse.json({
      userMessage: { id: userMessage.id, role: "USER", content: prompt, createdAt: userMessage.createdAt },
      message: {
        id: assistantMessage.id,
        role: "ASSISTANT",
        content: assistantMessage.content,
        slideVersion: assistantMessage.slideVersion,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        chatId,
      },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Slide generation failed" },
      { status: 500 }
    );
  }
}
