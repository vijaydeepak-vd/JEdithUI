import type {
  OllamaModel,
  OllamaModelWithBadges,
  OllamaStatus,
  OllamaChatMessage,
  OllamaChatResponse,
  ModelBadge,
} from "@/types";

// ─── Configuration ─────────────────────────────────
// Supports both local Ollama and cloud-hosted Ollama-compatible endpoints.
// Set OLLAMA_BASE_URL to a cloud endpoint and OLLAMA_API_KEY for auth.

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ||
  "http://localhost:11434";

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";

/** Default model when none is selected — cloud or local */
const DEFAULT_MODEL_NAME = process.env.OLLAMA_DEFAULT_MODEL || "gemma4:31b-cloud";

// ─── Model Classification ──────────────────────────

const VISION_FAMILIES = [
  "gemma4",
  "llava",
  "bakllava",
  "moondream",
  "llava-llama3",
];
const CODE_FAMILIES = [
  "codellama",
  "deepseek-coder",
  "starcoder",
  "codegemma",
  "qwen2.5-coder",
];

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

export async function listModels(): Promise<OllamaModelWithBadges[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return (data.models || []).map(classifyModel);
}

export async function getStatus(): Promise<OllamaStatus> {
  try {
    const models = await listModels();
    const defaultModel =
      models.find((m) => m.name === DEFAULT_MODEL_NAME) ||
      models.find((m) => m.name.includes("gemma4")) ||
      models[0] ||
      null;
    return {
      connected: true,
      modelCount: models.length,
      defaultModel: defaultModel?.name || null,
    };
  } catch {
    return { connected: false, modelCount: 0, defaultModel: null };
  }
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
      options: { temperature: 0.7, num_predict: 4096 },
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

// ─── Model Classification ──────────────────────────

function classifyModel(model: OllamaModel): OllamaModelWithBadges {
  const family = model.details?.family?.toLowerCase() || "";
  const families = (model.details?.families || []).map((f) => f.toLowerCase());
  const allFamilies = [family, ...families];
  const paramSize = model.details?.parameter_size || "";
  const modelName = model.name?.toLowerCase() || "";

  const badges: ModelBadge[] = [];
  const isVision = allFamilies.some((f) => VISION_FAMILIES.includes(f)) ||
    modelName.includes("gemma4");
  const isCode = allFamilies.some((f) => CODE_FAMILIES.includes(f));

  if (isVision) badges.push("vision");
  if (isCode) badges.push("code");

  const sizeNum = parseFloat(paramSize);
  if (sizeNum >= 13) badges.push("large");

  // Mark default/recommended model
  if (
    model.name === DEFAULT_MODEL_NAME ||
    family === "gemma4" ||
    modelName.includes("gemma4")
  ) {
    badges.push("recommended");
  }

  return { ...model, badges, isVision, isCode, sizeLabel: paramSize };
}
