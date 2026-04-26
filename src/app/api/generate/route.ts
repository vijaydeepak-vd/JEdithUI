import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCode } from "@/lib/ai/generate-code";
import { generateChatName, safeJsonParse } from "@/lib/utils";
import { z } from "zod";
import type { UILibrary, Framework, PaletteColor } from "@/types";

const GenerateSchema = z.object({
  chatId: z.string().min(1),
  prompt: z.string().min(1).max(10000),
  modelName: z.string().optional(),
  imageBase64: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { chatId, prompt, modelName, imageBase64 } = parsed.data;

  // Fetch chat with palette
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      palette: { include: { colors: { orderBy: { order: "asc" } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { codeVersion: true },
      },
    },
  });

  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const model = modelName || chat.modelName;
  const palette = chat.palette.colors as PaletteColor[];
  const libraries = safeJsonParse<UILibrary[]>(chat.libraries, []);
  const framework = (chat.framework || "REACT") as Framework;
  const existingCode = chat.messages[0]?.codeVersion?.code;

  // Auto-name the chat from the first prompt
  if (chat.name === "Untitled Chat" || !chat.name) {
    await prisma.chat.update({
      where: { id: chatId },
      data: { name: generateChatName(prompt) },
    });
  }

  // Get current version count for this chat
  const versionCount = await prisma.codeVersion.count({
    where: { message: { chatId } },
  });

  // Save user message (with optional image)
  const userMessage = await prisma.message.create({
    data: {
      role: "USER",
      content: prompt,
      chatId,
      ...(imageBase64 ? { imageBase64 } : {}),
    },
  });

  try {
    // Generate code
    const result = await generateCode({
      prompt,
      model,
      palette,
      libraries,
      framework,
      existingCode,
      imageBase64,
    });

    // Save assistant message + code version
    const assistantMessage = await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: result.warnings.length > 0
          ? `Generated successfully. ${result.warnings.length} warning(s): ${result.warnings.join("; ")}`
          : "Generated successfully.",
        chatId,
        codeVersion: {
          create: {
            code: result.code,
            language: result.language,
            version: versionCount + 1,
            modelName: model,
          },
        },
      },
      include: { codeVersion: true },
    });

    // Update chat updatedAt
    await prisma.chat.update({ where: { id: chatId }, data: { modelName: model } });

    return NextResponse.json({
      userMessage: { id: userMessage.id, role: "USER", content: prompt, hasImage: !!imageBase64, createdAt: userMessage.createdAt },
      message: {
        id: assistantMessage.id,
        role: "ASSISTANT",
        content: assistantMessage.content,
        codeVersion: assistantMessage.codeVersion,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    // If generation fails, save an error assistant message
    await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        chatId,
      },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
