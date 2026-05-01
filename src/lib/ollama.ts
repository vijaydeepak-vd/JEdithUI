import type {
  OllamaModelWithBadges,
  OllamaStatus,
  OllamaChatMessage,
  OllamaChatResponse,
  ModelBadge,
} from "@/types";

// ─── Configuration ─────────────────────────────────
// Connects to a cloud-hosted Ollama-compatible endpoint.
// Configure via OLLAMA_BASE_URL and OLLAMA_API_KEY env vars.

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ||
  "http://localhost:11434";

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";

/** Default model when none is selected */
const DEFAULT_MODEL_NAME = process.env.OLLAMA_DEFAULT_MODEL || "gemma4:31b-cloud";

/**
 * Available cloud models with capabilities — fully configured via env var.
 *
 * Format:  model-name|cap1|cap2|cap3, another-model|cap1|cap2
 * Caps:    vision, thinking, tools, code
 * Size:    auto-extracted from name (e.g. "31b" → "31B")
 *
 * Example:
 *   OLLAMA_MODEL_LIST="gemma4:31b-cloud|vision|thinking|tools, ministral-3:14b-cloud|vision|tools"
 */
const MODEL_LIST_RAW = process.env.OLLAMA_MODEL_LIST || DEFAULT_MODEL_NAME;

const VALID_CAPS = new Set(["vision", "thinking", "tools", "code"]);

// ─── Static Model List ─────────────────────────────

/** Parse a single "name|cap1|cap2" entry into a classified model. */
function parseModelEntry(entry: string): OllamaModelWithBadges {
  const parts = entry.split("|").map((s) => s.trim());
  const name = parts[0];
  const caps = parts.slice(1).filter((c) => VALID_CAPS.has(c));

  const badges: ModelBadge[] = [];
  const isVision = caps.includes("vision");
  const isCode = caps.includes("code");

  if (isVision) badges.push("vision");
  if (caps.includes("thinking")) badges.push("thinking");
  if (caps.includes("tools")) badges.push("tools");
  if (isCode) badges.push("code");

  // Extract param size from name (e.g. "31b", "397b", "14b")
  const sizeMatch = name.toLowerCase().match(/(\d+)b/);
  const sizeLabel = sizeMatch ? `${sizeMatch[1]}B` : "";
  if (sizeMatch && parseInt(sizeMatch[1]) >= 13) badges.push("large");

  // Mark default/recommended model
  if (name === DEFAULT_MODEL_NAME) badges.push("recommended");

  return { name, badges, isVision, isCode, sizeLabel };
}

/** Parse the env model list into classified model objects. */
function buildModelList(): OllamaModelWithBadges[] {
  return MODEL_LIST_RAW
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseModelEntry);
}

/** Cached model list — built once from env at startup. */
const CLOUD_MODELS = buildModelList();

// ─── Shared Headers ────────────────────────────────

/** Build headers with auth when API key is configured */
function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (OLLAMA_API_KEY) {
    headers["Authorization"] = `Bearer ${OLLAMA_API_KEY}`;
  }
  return headers;
}

// ─── API Functions ─────────────────────────────────

export async function checkConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      headers: buildHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Return the static list of available cloud models. */
export function listModels(): OllamaModelWithBadges[] {
  return CLOUD_MODELS;
}

export async function getStatus(): Promise<OllamaStatus> {
  const connected = await checkConnection();
  const models = listModels();
  const defaultModel =
    models.find((m) => m.name === DEFAULT_MODEL_NAME) || models[0] || null;

  return {
    connected,
    modelCount: models.length,
    defaultModel: defaultModel?.name || null,
  };
}

export async function chat(
  model: string,
  messages: OllamaChatMessage[]
): Promise<OllamaChatResponse> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.7, num_predict: 8192 },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Ollama chat error (${res.status}): ${error}`);
  }
  return res.json();
}

export async function chatStream(
  model: string,
  messages: OllamaChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: { temperature: 0.7, num_predict: 4096 },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Ollama stream error (${res.status}): ${error}`);
  }
  if (!res.body) throw new Error("No response body from Ollama");
  return res.body;
}

export async function analyzeImage(
  model: string,
  prompt: string,
  imageBase64: string
): Promise<string> {
  const response = await chat(model, [
    { role: "user", content: prompt, images: [imageBase64] },
  ]);
  return response.message.content;
}

/** Check if a model name supports vision (image) inputs. */
export function isVisionModel(modelName: string): boolean {
  const model = CLOUD_MODELS.find((m) => m.name === modelName);
  return model?.isVision ?? false;
}
