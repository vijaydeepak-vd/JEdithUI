import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateSkillPackage,
  generateSkillZipBufferBuiltin,
} from "@/lib/skill/generate-skill-zip";
import { safeJsonParse } from "@/lib/utils";
import type { PaletteColor, UILibrary } from "@/types";

/**
 * GET /api/palette/[id]/skill
 *
 * Downloads a Claude Code skill ZIP for the given palette.
 * The ZIP contains:
 *   - SKILL.md        (main skill instructions)
 *   - references/theme.md           (palette tokens)
 *   - references/coding-standards.md (coding conventions)
 *
 * Query params:
 *   - libraries: comma-separated list of UI libraries (optional)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch palette with colors
  const palette = await prisma.palette.findUnique({
    where: { id },
    include: { colors: { orderBy: { order: "asc" } } },
  });

  if (!palette) {
    return NextResponse.json({ error: "Palette not found" }, { status: 404 });
  }

  // Get skill name and libraries from query params
  const url = new URL(req.url);
  const skillName = url.searchParams.get("name")?.trim() || palette.name;
  const libsParam = url.searchParams.get("libraries");
  let libraries: UILibrary[] = [];

  if (libsParam) {
    libraries = libsParam.split(",").filter(Boolean) as UILibrary[];
  } else {
    // Try to infer from the most recent chat using this palette
    const recentChat = await prisma.chat.findFirst({
      where: { paletteId: id, type: "CODE" },
      orderBy: { updatedAt: "desc" },
    });
    if (recentChat) {
      libraries = safeJsonParse<UILibrary[]>(recentChat.libraries, []);
    }
  }

  const colors = palette.colors.map((c) => ({
    hex: c.hex,
    role: c.role,
    order: c.order,
  })) as PaletteColor[];

  // Generate the skill package using user-provided skill name
  const pkg = generateSkillPackage(skillName, palette.name, colors, libraries);

  // Build ZIP using built-in zero-dependency builder
  const zipBuffer = generateSkillZipBufferBuiltin(pkg);

  // Return as downloadable ZIP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextResponse(zipBuffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${pkg.folderName}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
