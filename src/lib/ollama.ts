import type {
  OllamaModel,
  OllamaModelWithBadges,
  OllamaStatus,
  OllamaChatMessage,
  OllamaChatResponse,
  ModelBadge,
} from "@/types";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

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

export async function checkConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listModels(): Promise<OllamaModelWithBadges[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return (data.models || []).map(classifyModel);
}

export async function getStatus(): Promise<OllamaStatus> {
  try {
    const models = await listModels();
    const defaultModel =
      models.find((m) => m.name.includes("gemma4")) || models[0] || null;
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
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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

function classifyModel(model: OllamaModel): OllamaModelWithBadges {
  const family = model.details?.family?.toLowerCase() || "";
  const families = (model.details?.families || []).map((f) => f.toLowerCase());
  const allFamilies = [family, ...families];
  const paramSize = model.details?.parameter_size || "";

  const badges: ModelBadge[] = [];
  const isVision = allFamilies.some((f) => VISION_FAMILIES.includes(f));
  const isCode = allFamilies.some((f) => CODE_FAMILIES.includes(f));

  if (isVision) badges.push("vision");
  if (isCode) badges.push("code");

  const sizeNum = parseFloat(paramSize);
  if (sizeNum >= 13) badges.push("large");
  if (family === "gemma4") badges.push("recommended");

  return { ...model, badges, isVision, isCode, sizeLabel: paramSize };
}
