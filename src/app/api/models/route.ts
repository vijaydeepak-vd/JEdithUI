import { NextResponse } from "next/server";
import { listModels, getStatus } from "@/lib/ollama";

export async function GET() {
  try {
    const models = listModels();
    const status = await getStatus();
    return NextResponse.json({ models, status });
  } catch {
    return NextResponse.json(
      {
        models: [],
        status: { connected: false, modelCount: 0, defaultModel: null },
      },
      { status: 200 }
    );
  }
}
