import { NextRequest, NextResponse } from "next/server";
import { parseCssToColors } from "@/lib/parsers/css-parser";

export async function POST(req: NextRequest) {
  const { css } = await req.json();
  if (!css || typeof css !== "string") {
    return NextResponse.json({ error: "css string required" }, { status: 400 });
  }
  const colors = parseCssToColors(css);
  return NextResponse.json({ colors });
}
