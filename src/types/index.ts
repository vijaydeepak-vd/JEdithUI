// ─── Enums ───────────────────────────────────────────

export type PaletteSource = "IMAGE" | "CSS" | "MANUAL";
export type ChatType = "CODE" | "PRESENTATION";
export type Framework = "REACT" | "VUE" | "SVELTE" | "ANGULAR" | "HTML";
export type MessageRole = "USER" | "ASSISTANT";

export type SlideTheme =
  | "default"
  | "minimal"
  | "colorful"
  | "dark"
  | "gradient"
  | "tech"
  | "business";

export type ColorRole =
  | "primary"
  | "secondary"
  | "accent"
  | "background"
  | "text"
  | "surface"
  | "border"
  | "success"
  | "warning"
  | "error"
  | "info";

export type UILibrary =
  | "tailwind"
  | "shadcn"
  | "mui"
  | "antd"
  | "chakra"
  | "mantine"
  | "recharts"
  | "react-table";

export type ExportFormat = "pptx" | "pdf" | "html";

export type FileCategory = "image" | "text" | "document";

export interface AttachedFile {
  id: string;
  name: string;
  category: FileCategory;
  size: number;
  mimeType: string;
  textContent?: string;  // extracted text (text files, parsed documents)
  base64?: string;       // base64 data (images, binary documents)
}

// ─── Ollama Types ────────────────────────────────────

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelWithBadges extends OllamaModel {
  badges: ModelBadge[];
  isVision: boolean;
  isCode: boolean;
  sizeLabel: string;
}

export type ModelBadge = "recommended" | "vision" | "code" | "large";

export interface OllamaStatus {
  connected: boolean;
  modelCount: number;
  defaultModel: string | null;
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

// ─── Palette Types ───────────────────────────────────

export interface PaletteColor {
  hex: string;
  role: ColorRole;
  order: number;
}

export interface PaletteData {
  id: string;
  name: string;
  source: PaletteSource;
  colors: PaletteColor[];
  createdAt: string;
  updatedAt: string;
}

// ─── Chat Types ──────────────────────────────────────

export interface ChatData {
  id: string;
  name: string;
  type: ChatType;
  framework: Framework | null;
  libraries: UILibrary[];
  slideTheme: SlideTheme | null;
  modelName: string;
  paletteId: string;
  palette: PaletteData;
  linkedChatId: string | null;
  messageCount: number;
  latestVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageData {
  id: string;
  role: MessageRole;
  content: string;
  imageBase64?: string | null;
  hasImage?: boolean;
  codeVersion?: CodeVersionData;
  slideVersion?: SlideVersionData;
  createdAt: string;
}

export interface CodeVersionData {
  id: string;
  code: string;
  language: string;
  version: number;
  modelName: string;
  createdAt: string;
}

export interface SlideVersionData {
  id: string;
  markdown: string;
  slideCount: number;
  version: number;
  modelName: string;
  createdAt: string;
}

// ─── Generation Request/Response ─────────────────────

export interface GenerateCodeRequest {
  chatId: string;
  prompt: string;
  modelName?: string;
}

export interface GenerateCodeResponse {
  message: MessageData;
  codeVersion: CodeVersionData;
}

export interface GenerateSlidesRequest {
  chatId: string;
  prompt: string;
  modelName?: string;
}

export interface GenerateSlidesResponse {
  message: MessageData;
  slideVersion: SlideVersionData;
}

// ─── Preview Types ───────────────────────────────────

export interface PreviewRequest {
  code: string;
  framework: Framework;
  libraries: UILibrary[];
  palette: PaletteColor[];
}

export interface PreviewResponse {
  html: string;
}

export interface PreviewError {
  type: "compile" | "runtime" | "cdn";
  message: string;
  line?: number;
  column?: number;
}

// ─── Marp/Presentation Types ─────────────────────────

export interface MarpExportRequest {
  markdown: string;
  format: ExportFormat;
}

export interface MarpPreviewRequest {
  markdown: string;
}

export interface SlideThemeOption {
  id: SlideTheme;
  name: string;
  description: string;
  style: string;
}

// ─── Swagger Types ───────────────────────────────────

export interface ParsedEndpoint {
  method: string;
  path: string;
  summary: string;
  suggestedUI: string;
  requestSchema: Record<string, unknown> | null;
  responseSchema: Record<string, unknown> | null;
  parameters: Array<{
    name: string;
    in: string;
    required: boolean;
    schema: Record<string, unknown>;
  }>;
}

export interface SwaggerParseResult {
  name: string;
  version: string;
  endpoints: ParsedEndpoint[];
}

// ─── Library Config Type ─────────────────────────────

export interface LibraryConfig {
  id: UILibrary;
  name: string;
  description: string;
  importPattern: string;
  themingInstructions: string;
  cdnUrls: string[];
  cdnGlobals?: Record<string, string>;
  componentMap: Record<string, string>;
  /** Frameworks this library is compatible with. Empty = all. */
  frameworks: Framework[];
}
