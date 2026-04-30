import { NextRequest, NextResponse } from "next/server";
import {
  generateSkillPackage,
  generateSkillZipBufferBuiltin,
} from "@/lib/skill/generate-skill-zip";
import type { PaletteColor, UILibrary } from "@/types";
import { z } from "zod";

/**
 * POST /api/palette/[id]/skill  (STATELESS)
 *
 * Downloads a Claude Code skill ZIP for the given palette data.
 * All palette/color data is sent by the client — no database lookup.
 *
 * The [id] segment is kept for backward URL compatibility but is unused.
 *
 * Request body:
 *   - skillName: string
 *   - paletteName: string
 *   - colors: PaletteColor[]
 *   - libraries: UILibrary[]  (optional)
 */
const SkillSchema = z.object({
  skillName: z.string().min(1),
  paletteName: z.string().min(1),
  colors: z.array(
    z.object({ hex: z.string(), role: z.string(), order: z.number() })
  ),
  libraries: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SkillSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { skillName, paletteName, colors, libraries } = parsed.data;

  // Generate the skill package
  const pkg = generateSkillPackage(
    skillName,
    paletteName,
    colors as PaletteColor[],
    libraries as UILibrary[]
  );

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

/**
 * Keep GET for backward compatibility (redirects to POST logic won't work for downloads).
 * This accepts query params: ?name=...&paletteName=...&colors=...&libraries=...
 * But the primary interface is now POST.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: "Use POST with { skillName, paletteName, colors, libraries } body" },
    { status: 405 }
  );
}
