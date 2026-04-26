# JEdithUI — Technical Implementation Specification

> **Purpose:** This document is the single source of truth for generating the entire JEdithUI application. Every section contains implementation-ready specifications — exact commands, complete schemas, API contracts, component interfaces, and code patterns. Follow the build order in Section 15.

---

## Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Environment & Configuration](#2-environment--configuration)
3. [Prisma Schema](#3-prisma-schema)
4. [Type Definitions](#4-type-definitions)
5. [Ollama Client](#5-ollama-client)
6. [API Routes](#6-api-routes)
7. [Prompt Architecture](#7-prompt-architecture)
8. [Library Knowledge Configs](#8-library-knowledge-configs)
9. [Post-Processing Pipeline](#9-post-processing-pipeline)
10. [Preview Engine (Custom Wrappers)](#10-preview-engine-custom-wrappers)
11. [Marp Integration](#11-marp-integration)
12. [Parsers](#12-parsers)
13. [Components](#13-components)
14. [Pages & Layouts](#14-pages--layouts)
15. [Build Order](#15-build-order)

---

## 1. Project Initialization

### 1.1 Create Next.js App

```bash
npx create-next-app@latest jedithui \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

cd jedithui
```

### 1.2 Install Core Dependencies

```bash
# Database
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite

# UI Components (shadcn/ui)
npx shadcn@latest init -d

# shadcn components needed (install all at once)
npx shadcn@latest add button card dialog dropdown-menu input label \
  select separator sheet tabs textarea toast badge scroll-area \
  tooltip popover command avatar skeleton switch slider \
  collapsible accordion alert

# AI / Ollama
# (No package needed — direct REST API calls via fetch)

# Code processing
npm install prettier @babel/parser

# Marp
npm install @marp-team/marp-cli @marp-team/marp-core

# File handling
npm install react-dropzone

# Utilities
npm install clsx tailwind-merge lucide-react nanoid
npm install zod                  # API validation
npm install swr                  # Client-side data fetching + revalidation

# Dev dependencies
npm install -D @types/node
```

### 1.3 Public Preview Assets

Download and cache these in `public/preview-assets/` for offline preview support:

```bash
mkdir -p public/preview-assets

# React runtime (v18)
curl -o public/preview-assets/react.production.min.js \
  "https://unpkg.com/react@18/umd/react.production.min.js"
curl -o public/preview-assets/react-dom.production.min.js \
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"

# Babel Standalone (for in-browser JSX compilation)
curl -o public/preview-assets/babel-standalone.min.js \
  "https://unpkg.com/@babel/standalone/babel.min.js"
```

### 1.4 Directory Structure

```
jedithui/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Dashboard
│   │   ├── palettes/
│   │   │   ├── page.tsx                 # Palette list
│   │   │   └── [id]/page.tsx            # Palette detail/edit
│   │   ├── chat/
│   │   │   ├── page.tsx                 # Code chat list
│   │   │   └── [id]/page.tsx            # Code chat thread
│   │   ├── presentations/
│   │   │   ├── page.tsx                 # Presentation list
│   │   │   └── [id]/page.tsx            # Presentation chat thread
│   │   ├── swagger/
│   │   │   └── page.tsx                 # Swagger import
│   │   └── api/
│   │       ├── palettes/
│   │       │   ├── route.ts             # GET (list), POST (create)
│   │       │   └── [id]/route.ts        # GET, PUT, DELETE
│   │       ├── extract-theme/
│   │       │   └── route.ts             # POST (image → palette)
│   │       ├── parse-css/
│   │       │   └── route.ts             # POST (CSS → palette)
│   │       ├── chat/
│   │       │   ├── route.ts             # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts         # GET, PUT, DELETE
│   │       │       └── messages/
│   │       │           └── route.ts     # GET (messages for chat)
│   │       ├── generate/
│   │       │   └── route.ts             # POST (code generation)
│   │       ├── presentation/
│   │       │   ├── generate/
│   │       │   │   └── route.ts         # POST (slide generation)
│   │       │   ├── export/
│   │       │   │   └── route.ts         # POST (md → PPTX/PDF/HTML)
│   │       │   └── preview/
│   │       │       └── route.ts         # POST (md → HTML for iframe)
│   │       ├── models/
│   │       │   └── route.ts             # GET (Ollama models + status)
│   │       ├── preview/
│   │       │   └── route.ts             # POST (code → preview HTML)
│   │       └── swagger/
│   │           └── route.ts             # POST (parse OpenAPI spec)
│   ├── components/
│   │   ├── palette/
│   │   │   ├── PaletteCard.tsx
│   │   │   ├── PaletteEditor.tsx
│   │   │   ├── ColorSwatch.tsx
│   │   │   └── ImageDropzone.tsx
│   │   ├── chat/
│   │   │   ├── ChatThread.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── CodePreview.tsx
│   │   │   ├── SlidePreview.tsx
│   │   │   ├── SlideFilmstrip.tsx
│   │   │   ├── VersionTimeline.tsx
│   │   │   └── ExportButtons.tsx
│   │   ├── generator/
│   │   │   ├── PromptInput.tsx
│   │   │   ├── ApiResponseInput.tsx
│   │   │   ├── FrameworkSelector.tsx
│   │   │   ├── LibrarySelector.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   └── SlideThemeSelector.tsx
│   │   ├── swagger/
│   │   │   ├── SpecImporter.tsx
│   │   │   ├── EndpointBrowser.tsx
│   │   │   └── EndpointCard.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── OllamaStatus.tsx
│   │   │   └── Logo.tsx
│   │   └── ui/                          # shadcn components (auto-generated)
│   ├── lib/
│   │   ├── db.ts
│   │   ├── ollama.ts
│   │   ├── utils.ts
│   │   ├── ai/
│   │   │   ├── extract-colors.ts
│   │   │   ├── generate-code.ts
│   │   │   ├── generate-slides.ts
│   │   │   └── prompts/
│   │   │       ├── system.ts
│   │   │       ├── system-slides.ts
│   │   │       ├── theme.ts
│   │   │       ├── refinement.ts
│   │   │       └── marp-syntax.ts
│   │   ├── library-configs/
│   │   │   ├── index.ts
│   │   │   ├── tailwind.ts
│   │   │   ├── shadcn.ts
│   │   │   ├── mui.ts
│   │   │   ├── antd.ts
│   │   │   ├── chakra.ts
│   │   │   ├── mantine.ts
│   │   │   └── recharts.ts
│   │   ├── marp/
│   │   │   ├── templates/
│   │   │   │   ├── default.md
│   │   │   │   ├── minimal.md
│   │   │   │   ├── colorful.md
│   │   │   │   ├── dark.md
│   │   │   │   ├── gradient.md
│   │   │   │   ├── tech.md
│   │   │   │   └── business.md
│   │   │   ├── theme-injector.ts
│   │   │   ├── marp-export.ts
│   │   │   └── marp-preview.ts
│   │   ├── preview/
│   │   │   ├── index.ts
│   │   │   ├── wrappers/
│   │   │   │   ├── html-wrapper.ts
│   │   │   │   └── react-wrapper.ts
│   │   │   ├── cdn-manager.ts
│   │   │   ├── sandbox.ts
│   │   │   └── error-handler.ts
│   │   ├── parsers/
│   │   │   ├── css-parser.ts
│   │   │   ├── swagger-parser.ts
│   │   │   └── api-schema.ts
│   │   ├── post-process/
│   │   │   ├── index.ts
│   │   │   ├── extract-code.ts
│   │   │   ├── validate-imports.ts
│   │   │   ├── validate-syntax.ts
│   │   │   ├── theme-compliance.ts
│   │   │   └── formatter.ts
│   │   └── theme/
│   │       └── converter.ts
│   ├── hooks/
│   │   ├── useOllamaModels.ts
│   │   ├── useChat.ts
│   │   ├── usePalettes.ts
│   │   └── usePreview.ts
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── preview-assets/
│       ├── babel-standalone.min.js
│       ├── react.production.min.js
│       └── react-dom.production.min.js
├── .env
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Environment & Configuration

### 2.1 `.env`

```env
DATABASE_URL="file:./dev.db"
OLLAMA_BASE_URL="http://localhost:11434"
NEXT_PUBLIC_OLLAMA_BASE_URL="http://localhost:11434"
```

### 2.2 `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // For image uploads (palette extraction)
    },
  },
  // Allow Ollama streaming responses
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 2.3 `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // JEdithUI brand
        jedith: {
          navy: "#1E2761",
          ice: "#CADCFC",
          coral: "#F96167",
          "navy-light": "#2A3578",
          "navy-dark": "#151D4A",
        },
        // shadcn color tokens (auto-configured by shadcn init)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 3. Prisma Schema

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── User (No Auth Phase 1) ───────────────────────────

model User {
  id        String   @id @default(cuid())
  sessionId String   @unique // Browser fingerprint / localStorage ID
  palettes  Palette[]
  chats     Chat[]
  createdAt DateTime @default(now())
}

// ─── Palette ──────────────────────────────────────────

model Palette {
  id        String   @id @default(cuid())
  name      String
  source    String   // "IMAGE" | "CSS" | "MANUAL"
  colors    Color[]
  chats     Chat[]
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Color {
  id        String  @id @default(cuid())
  hex       String  // e.g. "#1E2761"
  role      String  // "primary" | "secondary" | "accent" | "background" | "text" | "surface" | "border" | "success" | "warning" | "error" | "info"
  order     Int     @default(0) // Display order within palette
  paletteId String
  palette   Palette @relation(fields: [paletteId], references: [id], onDelete: Cascade)
}

// ─── Chat (Code Generation + Presentations) ──────────

model Chat {
  id           String    @id @default(cuid())
  name         String    // Auto-generated from first prompt, editable
  type         String    // "CODE" | "PRESENTATION"

  // Code-specific fields
  framework    String?   // "REACT" | "VUE" | "SVELTE" | "ANGULAR" | "HTML"
  libraries    String    @default("[]") // JSON array: ["tailwind", "shadcn", "recharts"]

  // Presentation-specific fields
  slideTheme   String?   // "default" | "minimal" | "colorful" | "dark" | "gradient" | "tech" | "business"

  // Common fields
  modelName    String    @default("gemma4:e4b") // Ollama model used
  paletteId    String
  palette      Palette   @relation(fields: [paletteId], references: [id])
  linkedChatId String?   // Links presentation → source code chat
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages     Message[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId])
  @@index([type])
  @@index([paletteId])
}

model Message {
  id           String        @id @default(cuid())
  role         String        // "USER" | "ASSISTANT"
  content      String        // The prompt or response text
  codeVersion  CodeVersion?  // Linked code version (code chats only)
  slideVersion SlideVersion? // Linked slide version (presentation chats only)
  chatId       String
  chat         Chat          @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdAt    DateTime      @default(now())

  @@index([chatId])
}

model CodeVersion {
  id        String   @id @default(cuid())
  code      String   // Full generated code
  language  String   @default("tsx") // "tsx" | "jsx" | "html" | "vue" | "svelte"
  version   Int      // Incrementing per chat (1, 2, 3...)
  modelName String   // Which Ollama model generated this version
  messageId String   @unique
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model SlideVersion {
  id         String   @id @default(cuid())
  markdown   String   // Full Marp markdown with embedded theme CSS
  slideCount Int      // Number of slides (count of "---" separators + 1)
  version    Int      // Incrementing per chat
  modelName  String   // Which Ollama model generated this version
  messageId  String   @unique
  message    Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
}

// ─── Swagger/OpenAPI Imports ─────────────────────────

model SwaggerSpec {
  id         String           @id @default(cuid())
  name       String           // "Product Service v2.1"
  version    String?          // From spec info.version
  specJson   String           // Full JSON spec stored as text
  endpoints  SwaggerEndpoint[]
  userId     String
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
}

model SwaggerEndpoint {
  id            String      @id @default(cuid())
  method        String      // "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  path          String      // "/api/products/{id}"
  summary       String?
  suggestedUI   String?     // "table" | "detail" | "form" | "dialog" | "filter-table"
  requestSchema String?     // JSON string of request body schema
  responseSchema String?    // JSON string of response schema
  specId        String
  spec          SwaggerSpec @relation(fields: [specId], references: [id], onDelete: Cascade)
  chatId        String?     // Linked chat if UI was generated

  @@index([specId])
}
```

### Initialize Database

```bash
npx prisma db push
npx prisma generate
```

---

## 4. Type Definitions

### `src/types/index.ts`

```typescript
// ─── Enums (mirror Prisma string fields) ─────────────

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
  sizeLabel: string; // "4B", "7B", "13B", etc.
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
  images?: string[]; // Base64 encoded images (for vision models)
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
  modelName?: string; // Override chat's default model
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
  html: string; // Full HTML document for iframe srcdoc
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
  style: string; // "general" | "academic" | "creative" | "tech" | "corporate"
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
  importPattern: string;      // How to import components
  themingInstructions: string; // How to apply palette colors
  cdnUrls: string[];          // CDN URLs for preview
  cdnGlobals?: Record<string, string>; // Global variable names from CDN
  componentMap: Record<string, string>; // Component → library mapping
}
```

---

## 5. Ollama Client

### `src/lib/ollama.ts`

```typescript
/**
 * Ollama REST API client.
 * All communication with Ollama goes through this module.
 *
 * Ollama API docs: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import type {
  OllamaModel,
  OllamaModelWithBadges,
  OllamaStatus,
  OllamaChatMessage,
  OllamaChatResponse,
  ModelBadge,
} from "@/types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// ─── Vision model families (support image input) ────
const VISION_FAMILIES = ["gemma4", "llava", "bakllava", "moondream", "llava-llama3"];

// ─── Code-optimized model families ──────────────────
const CODE_FAMILIES = ["codellama", "deepseek-coder", "starcoder", "codegemma", "qwen2.5-coder"];

/**
 * Check if Ollama is running and reachable.
 */
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

/**
 * Fetch all installed Ollama models with badge classification.
 */
export async function listModels(): Promise<OllamaModelWithBadges[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

  const data = await res.json();
  return (data.models || []).map(classifyModel);
}

/**
 * Get Ollama connection status summary.
 */
export async function getStatus(): Promise<OllamaStatus> {
  try {
    const models = await listModels();
    const defaultModel = models.find((m) =>
      m.name.includes("gemma4")
    ) || models[0] || null;

    return {
      connected: true,
      modelCount: models.length,
      defaultModel: defaultModel?.name || null,
    };
  } catch {
    return { connected: false, modelCount: 0, defaultModel: null };
  }
}

/**
 * Send a chat completion request to Ollama (non-streaming).
 */
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
      options: {
        temperature: 0.7,
        num_predict: 4096,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Ollama chat error (${res.status}): ${error}`);
  }

  return res.json();
}

/**
 * Send a chat completion request to Ollama (streaming).
 * Returns a ReadableStream for SSE consumption.
 */
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
      options: {
        temperature: 0.7,
        num_predict: 4096,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Ollama stream error (${res.status}): ${error}`);
  }

  if (!res.body) throw new Error("No response body from Ollama");
  return res.body;
}

/**
 * Send an image to a vision-capable model for analysis.
 * Used for image-to-palette extraction.
 */
export async function analyzeImage(
  model: string,
  prompt: string,
  imageBase64: string
): Promise<string> {
  const response = await chat(model, [
    {
      role: "user",
      content: prompt,
      images: [imageBase64],
    },
  ]);
  return response.message.content;
}

// ─── Internal helpers ────────────────────────────────

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

  // Mark as "large" if 13B+
  const sizeNum = parseFloat(paramSize);
  if (sizeNum >= 13) badges.push("large");

  // Recommend gemma4 models
  if (family === "gemma4") badges.push("recommended");

  return {
    ...model,
    badges,
    isVision,
    isCode,
    sizeLabel: paramSize,
  };
}
```

### `src/lib/db.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes to human-readable size.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Generate a chat name from the first user prompt.
 */
export function generateChatName(prompt: string): string {
  const cleaned = prompt.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = cleaned.split(/\s+/).slice(0, 5);
  return words.join(" ") || "Untitled Chat";
}

/**
 * Count Marp slides from markdown (number of "---" separators + 1).
 */
export function countMarpSlides(markdown: string): number {
  // Remove frontmatter block
  const withoutFrontmatter = markdown.replace(/^---\n[\s\S]*?\n---\n/, "");
  const separators = (withoutFrontmatter.match(/\n---\n/g) || []).length;
  return separators + 1;
}

/**
 * Parse JSON string safely, returning default on failure.
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
```

---

## 6. API Routes

### 6.1 Models — `GET /api/models`

**Purpose:** List all installed Ollama models and connection status.

**File:** `src/app/api/models/route.ts`

```typescript
import { NextResponse } from "next/server";
import { listModels, getStatus } from "@/lib/ollama";

export async function GET() {
  try {
    const [models, status] = await Promise.all([
      listModels().catch(() => []),
      getStatus(),
    ]);

    return NextResponse.json({ models, status });
  } catch (error) {
    return NextResponse.json(
      { models: [], status: { connected: false, modelCount: 0, defaultModel: null } },
      { status: 200 } // Always 200 — client handles disconnected state
    );
  }
}
```

**Response:**
```json
{
  "models": [
    {
      "name": "gemma4:e4b",
      "size": 5500000000,
      "details": { "parameter_size": "4B", "quantization_level": "Q4_K_M" },
      "badges": ["recommended", "vision"],
      "isVision": true,
      "isCode": false,
      "sizeLabel": "4B"
    }
  ],
  "status": {
    "connected": true,
    "modelCount": 3,
    "defaultModel": "gemma4:e4b"
  }
}
```

---

### 6.2 Palettes — `GET/POST /api/palettes`

**File:** `src/app/api/palettes/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreatePaletteSchema = z.object({
  name: z.string().min(1).max(100),
  source: z.enum(["IMAGE", "CSS", "MANUAL"]),
  colors: z.array(z.object({
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    role: z.string(),
    order: z.number().int().min(0),
  })).min(1).max(20),
  sessionId: z.string().min(1),
});

// GET — List all palettes for a session
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { sessionId },
    include: { palettes: { include: { colors: { orderBy: { order: "asc" } } }, orderBy: { updatedAt: "desc" } } },
  });

  return NextResponse.json({ palettes: user?.palettes || [] });
}

// POST — Create a new palette
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreatePaletteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, source, colors, sessionId } = parsed.data;

  // Upsert user (no auth — create if not exists)
  const user = await prisma.user.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {},
  });

  const palette = await prisma.palette.create({
    data: {
      name,
      source,
      userId: user.id,
      colors: {
        create: colors.map((c) => ({
          hex: c.hex,
          role: c.role,
          order: c.order,
        })),
      },
    },
    include: { colors: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ palette }, { status: 201 });
}
```

---

### 6.3 Palette by ID — `GET/PUT/DELETE /api/palettes/[id]`

**File:** `src/app/api/palettes/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// GET — Single palette with colors
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const palette = await prisma.palette.findUnique({
    where: { id },
    include: { colors: { orderBy: { order: "asc" } } },
  });

  if (!palette) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ palette });
}

// PUT — Update palette name and/or colors
const UpdatePaletteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  colors: z.array(z.object({
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    role: z.string(),
    order: z.number().int().min(0),
  })).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdatePaletteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, colors } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;

  if (colors) {
    // Delete existing colors and recreate
    await prisma.color.deleteMany({ where: { paletteId: id } });
    await prisma.color.createMany({
      data: colors.map((c) => ({ ...c, paletteId: id })),
    });
  }

  const palette = await prisma.palette.update({
    where: { id },
    data: updateData,
    include: { colors: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ palette });
}

// DELETE — Remove palette
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.palette.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

---

### 6.4 Extract Theme — `POST /api/extract-theme`

**Purpose:** Send an image to a vision-capable Ollama model to extract a color palette.

**File:** `src/app/api/extract-theme/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/ollama";
import { z } from "zod";

const ExtractThemeSchema = z.object({
  imageBase64: z.string().min(1), // Raw base64 (no data URI prefix)
  model: z.string().min(1),       // Must be a vision-capable model
});

const EXTRACTION_PROMPT = `Analyze this website screenshot and extract the color palette.
Return a JSON array of colors with their semantic roles.

Rules:
- Extract 5-10 distinct colors that define the site's visual identity.
- Assign each color a role: "primary", "secondary", "accent", "background", "text", "surface", "border", "success", "warning", "error", or "info".
- Use exact hex values (e.g., "#1E2761").
- Order by visual prominence (most dominant first).

Return ONLY valid JSON in this exact format, no other text:
[
  { "hex": "#1E2761", "role": "primary", "order": 0 },
  { "hex": "#CADCFC", "role": "secondary", "order": 1 },
  { "hex": "#F96167", "role": "accent", "order": 2 }
]`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ExtractThemeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { imageBase64, model } = parsed.data;

  try {
    const response = await analyzeImage(model, EXTRACTION_PROMPT, imageBase64);

    // Extract JSON from response (model may wrap it in markdown fences)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse color extraction result", raw: response }, { status: 422 });
    }

    const colors = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ colors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
```

---

### 6.5 Parse CSS — `POST /api/parse-css`

**File:** `src/app/api/parse-css/route.ts`

```typescript
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
```

---

### 6.6 Chat CRUD — `GET/POST /api/chat` and `/api/chat/[id]`

**File:** `src/app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateChatSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["CODE", "PRESENTATION"]),
  framework: z.enum(["REACT", "VUE", "SVELTE", "ANGULAR", "HTML"]).optional(),
  libraries: z.array(z.string()).optional().default([]),
  slideTheme: z.string().optional(),
  modelName: z.string().min(1),
  paletteId: z.string().min(1),
  linkedChatId: z.string().optional(),
  sessionId: z.string().min(1),
});

// GET — List chats for a session, optionally filtered by type
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const type = req.nextUrl.searchParams.get("type"); // "CODE" | "PRESENTATION" | null (all)
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { sessionId } });
  if (!user) return NextResponse.json({ chats: [] });

  const where: Record<string, unknown> = { userId: user.id };
  if (type) where.type = type;

  const chats = await prisma.chat.findMany({
    where,
    include: {
      palette: { include: { colors: { orderBy: { order: "asc" } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { codeVersion: true, slideVersion: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Transform to include messageCount and latestVersion
  const transformed = chats.map((chat) => {
    const lastMsg = chat.messages[0];
    const latestVersion =
      lastMsg?.codeVersion?.version || lastMsg?.slideVersion?.version || 0;

    return {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      framework: chat.framework,
      libraries: JSON.parse(chat.libraries),
      slideTheme: chat.slideTheme,
      modelName: chat.modelName,
      paletteId: chat.paletteId,
      palette: chat.palette,
      linkedChatId: chat.linkedChatId,
      messageCount: chat._count.messages,
      latestVersion,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({ chats: transformed });
}

// POST — Create a new chat
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateChatSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sessionId, libraries, ...chatData } = parsed.data;

  const user = await prisma.user.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {},
  });

  const chat = await prisma.chat.create({
    data: {
      ...chatData,
      libraries: JSON.stringify(libraries),
      userId: user.id,
    },
    include: {
      palette: { include: { colors: { orderBy: { order: "asc" } } } },
    },
  });

  return NextResponse.json({ chat }, { status: 201 });
}
```

**File:** `src/app/api/chat/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — Single chat with all messages and versions
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      palette: { include: { colors: { orderBy: { order: "asc" } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { codeVersion: true, slideVersion: true },
      },
    },
  });

  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    chat: {
      ...chat,
      libraries: JSON.parse(chat.libraries),
    },
  });
}

// PUT — Update chat name, model, framework, etc.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowedFields = ["name", "modelName", "framework", "slideTheme"];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }
  if (body.libraries) updateData.libraries = JSON.stringify(body.libraries);

  const chat = await prisma.chat.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ chat });
}

// DELETE — Remove chat and all messages/versions
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.chat.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

**File:** `src/app/api/chat/[id]/messages/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — All messages for a chat (with code/slide versions)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const messages = await prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: "asc" },
    include: { codeVersion: true, slideVersion: true },
  });

  return NextResponse.json({ messages });
}
```

---

### 6.7 Generate Code — `POST /api/generate`

**Purpose:** The primary code generation endpoint. Creates a user message, calls Ollama, creates an assistant message with a code version.

**File:** `src/app/api/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCode } from "@/lib/ai/generate-code";
import { postProcess } from "@/lib/post-process";
import { generateChatName } from "@/lib/utils";
import { z } from "zod";

const GenerateSchema = z.object({
  chatId: z.string().min(1),
  prompt: z.string().min(1).max(10000),
  modelName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { chatId, prompt, modelName: overrideModel } = parsed.data;

  // Fetch chat with palette and latest code version
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

  const model = overrideModel || chat.modelName;
  const latestCode = chat.messages[0]?.codeVersion?.code || null;
  const latestVersion = chat.messages[0]?.codeVersion?.version || 0;
  const libraries = JSON.parse(chat.libraries) as string[];

  // Auto-name chat from first prompt
  const isFirstMessage = chat.messages.length === 0;
  if (isFirstMessage) {
    await prisma.chat.update({
      where: { id: chatId },
      data: { name: generateChatName(prompt) },
    });
  }

  // 1. Save user message
  const userMessage = await prisma.message.create({
    data: { role: "USER", content: prompt, chatId },
  });

  try {
    // 2. Generate code via Ollama
    const rawCode = await generateCode({
      model,
      prompt,
      latestCode,
      palette: chat.palette.colors,
      framework: chat.framework || "REACT",
      libraries,
    });

    // 3. Post-process (extract, validate, format)
    const processedCode = await postProcess(rawCode, chat.framework || "REACT", libraries);

    // 4. Save assistant message + code version
    const assistantMessage = await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: `Generated version ${latestVersion + 1}`,
        chatId,
        codeVersion: {
          create: {
            code: processedCode,
            language: chat.framework === "HTML" ? "html" : "tsx",
            version: latestVersion + 1,
            modelName: model,
          },
        },
      },
      include: { codeVersion: true },
    });

    // 5. Update chat timestamp and model
    await prisma.chat.update({
      where: { id: chatId },
      data: { modelName: model, updatedAt: new Date() },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
      codeVersion: assistantMessage.codeVersion,
    });
  } catch (error) {
    // Save error as assistant message so user can see it
    const errorMsg = error instanceof Error ? error.message : "Generation failed";
    const assistantMessage = await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: `Error: ${errorMsg}`,
        chatId,
      },
    });

    return NextResponse.json(
      { userMessage, assistantMessage, error: errorMsg },
      { status: 500 }
    );
  }
}
```

---

### 6.8 Generate Slides — `POST /api/presentation/generate`

**File:** `src/app/api/presentation/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlides } from "@/lib/ai/generate-slides";
import { generateChatName, countMarpSlides } from "@/lib/utils";
import { z } from "zod";

const GenerateSlidesSchema = z.object({
  chatId: z.string().min(1),
  prompt: z.string().min(1).max(10000),
  modelName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateSlidesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { chatId, prompt, modelName: overrideModel } = parsed.data;

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
  if (chat.type !== "PRESENTATION") return NextResponse.json({ error: "Not a presentation chat" }, { status: 400 });

  const model = overrideModel || chat.modelName;
  const latestMarkdown = chat.messages[0]?.slideVersion?.markdown || null;
  const latestVersion = chat.messages[0]?.slideVersion?.version || 0;

  const isFirstMessage = chat.messages.length === 0;
  if (isFirstMessage) {
    await prisma.chat.update({
      where: { id: chatId },
      data: { name: generateChatName(prompt) },
    });
  }

  const userMessage = await prisma.message.create({
    data: { role: "USER", content: prompt, chatId },
  });

  try {
    const markdown = await generateSlides({
      model,
      prompt,
      latestMarkdown,
      palette: chat.palette.colors,
      slideTheme: chat.slideTheme || "business",
    });

    const slideCount = countMarpSlides(markdown);

    const assistantMessage = await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: `Generated ${slideCount}-slide presentation (v${latestVersion + 1})`,
        chatId,
        slideVersion: {
          create: {
            markdown,
            slideCount,
            version: latestVersion + 1,
            modelName: model,
          },
        },
      },
      include: { slideVersion: true },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { modelName: model, updatedAt: new Date() },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
      slideVersion: assistantMessage.slideVersion,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Slide generation failed";
    const assistantMessage = await prisma.message.create({
      data: { role: "ASSISTANT", content: `Error: ${errorMsg}`, chatId },
    });
    return NextResponse.json({ userMessage, assistantMessage, error: errorMsg }, { status: 500 });
  }
}
```

---

### 6.9 Presentation Export — `POST /api/presentation/export`

**File:** `src/app/api/presentation/export/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { exportMarp } from "@/lib/marp/marp-export";
import { z } from "zod";

const ExportSchema = z.object({
  markdown: z.string().min(1),
  format: z.enum(["pptx", "pdf", "html"]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ExportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { markdown, format } = parsed.data;

  try {
    const buffer = await exportMarp(markdown, format);
    const contentTypes: Record<string, string> = {
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      pdf: "application/pdf",
      html: "text/html",
    };

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentTypes[format],
        "Content-Disposition": `attachment; filename="presentation.${format}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
```

---

### 6.10 Presentation Preview — `POST /api/presentation/preview`

**File:** `src/app/api/presentation/preview/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { previewMarp } from "@/lib/marp/marp-preview";

export async function POST(req: NextRequest) {
  const { markdown } = await req.json();
  if (!markdown) return NextResponse.json({ error: "markdown required" }, { status: 400 });

  try {
    const html = await previewMarp(markdown);
    return NextResponse.json({ html });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview failed" },
      { status: 500 }
    );
  }
}
```

---

### 6.11 Code Preview — `POST /api/preview`

**Purpose:** Wrap generated code in a framework-specific HTML shell for iframe preview.

**File:** `src/app/api/preview/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { buildPreviewHtml } from "@/lib/preview";
import { z } from "zod";

const PreviewSchema = z.object({
  code: z.string().min(1),
  framework: z.enum(["REACT", "VUE", "SVELTE", "ANGULAR", "HTML"]),
  libraries: z.array(z.string()).default([]),
  palette: z.array(z.object({
    hex: z.string(),
    role: z.string(),
  })),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const html = buildPreviewHtml(parsed.data);
    return NextResponse.json({ html });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview build failed" },
      { status: 500 }
    );
  }
}
```

---

### 6.12 Swagger Import — `POST /api/swagger`

**File:** `src/app/api/swagger/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { parseOpenApiSpec } from "@/lib/parsers/swagger-parser";
import { z } from "zod";

const SwaggerSchema = z.object({
  spec: z.string().min(1),  // JSON or YAML string
  sessionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SwaggerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const result = parseOpenApiSpec(parsed.data.spec);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Spec parsing failed" },
      { status: 500 }
    );
  }
}
```

---

## 7. Prompt Architecture

### 7.1 System Prompt — Code Generation

**File:** `src/lib/ai/prompts/system.ts`

```typescript
import type { PaletteColor, UILibrary } from "@/types";
import { getLibraryConfig } from "@/lib/library-configs";

/**
 * Layer 1: System Identity.
 * Defines the AI's role and output rules.
 */
export function buildSystemPrompt(framework: string): string {
  return `You are JEdithUI, an expert UI code generator. You generate production-ready ${framework} code.

RULES:
1. Output ONLY the code — no explanations, no markdown fences, no comments about what you did.
2. Use the provided color palette for ALL colors. NEVER hardcode arbitrary colors.
3. Generate a single, complete, self-contained component.
4. The main export must be a component named "App".
5. Use semantic HTML elements (header, main, section, nav, footer).
6. Make all layouts responsive using CSS/Tailwind breakpoints.
7. Include proper hover states, transitions, and visual feedback.
8. Use the specified UI libraries for components — follow their exact import patterns.
9. Handle empty/null states gracefully.
10. NEVER truncate the output — always provide complete, working code.`;
}

/**
 * Layer 2: Library Knowledge.
 * Injected based on the user's selected libraries.
 */
export function buildLibraryPrompt(libraries: UILibrary[]): string {
  if (libraries.length === 0) return "";

  const configs = libraries.map(getLibraryConfig).filter(Boolean);
  const sections = configs.map((config) => {
    if (!config) return "";
    return `### ${config.name}
Import pattern: ${config.importPattern}
Theming: ${config.themingInstructions}
Available components: ${Object.keys(config.componentMap).join(", ")}`;
  });

  return `\n\nLIBRARY INSTRUCTIONS:\n${sections.join("\n\n")}

PRIORITY: When multiple libraries provide the same component type, prefer the first one listed above.`;
}

/**
 * Layer 3: Theme Context.
 * Injects the user's palette colors.
 */
export function buildThemePrompt(palette: PaletteColor[]): string {
  const colorLines = palette
    .map((c) => `  --color-${c.role}: ${c.hex};`)
    .join("\n");

  return `\n\nCOLOR PALETTE (use these exact colors via CSS variables or direct hex):
:root {
${colorLines}
}

Apply colors by role:
- Backgrounds: use "background" or "surface" colors
- Text: use "text" color for body, "primary" for headings
- Buttons/CTAs: use "accent" color
- Borders/Dividers: use "border" color
- Status indicators: use "success", "warning", "error", "info" colors`;
}
```

### 7.2 System Prompt — Slide Generation

**File:** `src/lib/ai/prompts/system-slides.ts`

```typescript
import type { PaletteColor } from "@/types";
import { buildThemePrompt } from "./theme";

export function buildSlideSystemPrompt(): string {
  return `You are JEdithUI Presentation Generator. You generate valid Marp markdown presentations.

RULES:
1. Output ONLY the Marp markdown — no explanations before or after.
2. Start with the Marp frontmatter: ---\\nmarp: true\\ntheme: default\\npaginate: true\\n---
3. Include a <style> block after the frontmatter with the theme CSS provided.
4. Separate slides with --- on its own line.
5. Use varied layouts: title slides, bullet lists, two-column (using HTML), image placeholders, quotes.
6. Keep text concise: max 5-6 bullet points per slide, max 8 words per bullet.
7. Use the provided color palette in ALL CSS styling.
8. Include speaker notes using <!-- comment --> syntax where helpful.
9. NEVER truncate — provide the complete presentation.`;
}

/**
 * Marp syntax reference injected as context.
 */
export function buildMarpSyntaxPrompt(): string {
  return `
MARP SYNTAX REFERENCE:
- Slide separator: --- (on its own line)
- Frontmatter: ---\\nmarp: true\\ntheme: default\\n---
- Directives: <!-- _class: lead --> for slide-level, <!-- class: invert --> for all
- Images: ![bg](url) for background, ![bg left](url) for split, ![bg right:40%](url) for sized split
- Two columns: Use <div class="columns"><div> and </div><div> with CSS grid
- Header/footer: <!-- header: "Title" --> and <!-- footer: "Footer text" -->
- Scoped styles: <style scoped> for single slide

SLIDE LAYOUT PATTERNS:
- Title slide: # Big Title\\n## Subtitle\\n<!-- _class: lead -->
- Content slide: ## Heading\\n- Bullet 1\\n- Bullet 2
- Two-column: Use CSS grid with .columns class
- Image + text: ![bg left:40%](image-url)\\n## Text on right side
- Quote slide: > "Quote text"\\n> — Attribution
- Stats slide: Use HTML table or grid for KPI numbers`;
}

export function buildSlideThemePrompt(
  palette: PaletteColor[],
  theme: string
): string {
  const base = buildThemePrompt(palette);

  return `${base}

SLIDE THEME: ${theme}
Apply the palette colors to the Marp <style> block using these patterns:
- section { background: var(--color-background); color: var(--color-text); }
- section h1, section h2 { color: var(--color-primary); }
- section a { color: var(--color-accent); }
- strong { color: var(--color-accent); }
- code { background: var(--color-surface); }`;
}
```

### 7.3 Refinement Prompt Builder

**File:** `src/lib/ai/prompts/refinement.ts`

```typescript
/**
 * Build the user message for a refinement turn.
 * Sends the LATEST code/markdown + the new instruction.
 * Does NOT send full chat history — keeps context focused.
 */
export function buildCodeRefinement(latestCode: string, newInstruction: string): string {
  return `Here is the current code:

\`\`\`
${latestCode}
\`\`\`

User instruction: ${newInstruction}

Apply the user's instruction to the code above. Return the COMPLETE updated code, not just the changes. Follow all the same rules from your system prompt.`;
}

export function buildSlideRefinement(latestMarkdown: string, newInstruction: string): string {
  return `Here is the current Marp presentation:

\`\`\`
${latestMarkdown}
\`\`\`

User instruction: ${newInstruction}

Apply the instruction to the presentation above. Return the COMPLETE updated Marp markdown, not just the changes. Maintain the same theme and palette.`;
}

/**
 * Build an auto-fix prompt when the preview shows an error.
 */
export function buildErrorFixPrompt(code: string, error: string): string {
  return `Here is the current code:

\`\`\`
${code}
\`\`\`

The preview shows this error:
${error}

Fix this error and return the COMPLETE corrected code.`;
}
```

---

## 8. Library Knowledge Configs

### `src/lib/library-configs/index.ts`

```typescript
import type { LibraryConfig, UILibrary } from "@/types";
import { tailwindConfig } from "./tailwind";
import { shadcnConfig } from "./shadcn";
import { muiConfig } from "./mui";
import { antdConfig } from "./antd";
import { chakraConfig } from "./chakra";
import { mantineConfig } from "./mantine";
import { rechartsConfig } from "./recharts";

const configs: Record<UILibrary, LibraryConfig> = {
  tailwind: tailwindConfig,
  shadcn: shadcnConfig,
  mui: muiConfig,
  antd: antdConfig,
  chakra: chakraConfig,
  mantine: mantineConfig,
  recharts: rechartsConfig,
  "react-table": rechartsConfig, // Placeholder — implement separately
};

export function getLibraryConfig(id: UILibrary): LibraryConfig | null {
  return configs[id] || null;
}

export function getAllLibraryConfigs(): LibraryConfig[] {
  return Object.values(configs);
}
```

### Example: `src/lib/library-configs/tailwind.ts`

```typescript
import type { LibraryConfig } from "@/types";

export const tailwindConfig: LibraryConfig = {
  id: "tailwind",
  name: "Tailwind CSS",
  description: "Utility-first CSS framework for layout and custom styling",
  importPattern: "No imports needed — use Tailwind classes directly in className attributes.",
  themingInstructions: `Apply palette colors using Tailwind arbitrary values:
- Background: className="bg-[var(--color-background)]" or className="bg-[#hex]"
- Text: className="text-[var(--color-text)]"
- Border: className="border-[var(--color-border)]"
- Use Tailwind spacing, flexbox, and grid utilities for layout.
- Use responsive prefixes: sm:, md:, lg:, xl: for breakpoints.`,
  cdnUrls: [
    "https://cdn.tailwindcss.com",
  ],
  cdnGlobals: {},
  componentMap: {
    layout: "Tailwind grid/flexbox utilities",
    spacing: "Tailwind padding/margin utilities",
    responsive: "Tailwind breakpoint prefixes",
    typography: "Tailwind text utilities",
  },
};
```

### Example: `src/lib/library-configs/shadcn.ts`

```typescript
import type { LibraryConfig } from "@/types";

export const shadcnConfig: LibraryConfig = {
  id: "shadcn",
  name: "shadcn/ui",
  description: "Beautifully designed components built with Radix UI and Tailwind CSS",
  importPattern: `Import from @/components/ui/:
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";`,
  themingInstructions: `shadcn/ui uses CSS variables for theming. The palette colors are already injected as CSS variables. Use shadcn's built-in variants:
- <Button variant="default"> uses --primary
- <Button variant="destructive"> uses --destructive
- <Card> uses --card background
- Text colors follow --foreground and --muted-foreground`,
  cdnUrls: [], // shadcn is copy-paste components, no CDN
  cdnGlobals: {},
  componentMap: {
    Button: "button",
    Card: "card",
    Input: "input",
    Dialog: "dialog",
    Select: "select",
    Badge: "badge",
    Tabs: "tabs",
    Table: "table",
    Tooltip: "tooltip",
    DropdownMenu: "dropdown-menu",
    Sheet: "sheet",
    Toast: "toast",
    Avatar: "avatar",
    Separator: "separator",
    ScrollArea: "scroll-area",
  },
};
```

### Example: `src/lib/library-configs/mui.ts`

```typescript
import type { LibraryConfig } from "@/types";

export const muiConfig: LibraryConfig = {
  id: "mui",
  name: "Material UI (MUI)",
  description: "Comprehensive React UI library following Material Design",
  importPattern: `Import from @mui/material:
import { Button, TextField, Card, Typography, Box, Grid, Chip, Avatar } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";`,
  themingInstructions: `Apply palette using MUI's sx prop or inline styles:
- <Button sx={{ bgcolor: 'var(--color-accent)', color: '#fff' }}>
- <Box sx={{ color: 'var(--color-text)', bgcolor: 'var(--color-background)' }}>
- For DataGrid, use sx to style header and rows.
Do NOT use createTheme or ThemeProvider in generated code (not available in preview).`,
  cdnUrls: [
    "https://unpkg.com/@mui/material@latest/umd/material-ui.production.min.js",
  ],
  cdnGlobals: { "@mui/material": "MaterialUI" },
  componentMap: {
    Button: "Button",
    TextField: "TextField",
    Card: "Card",
    CardContent: "CardContent",
    Typography: "Typography",
    Box: "Box",
    Grid: "Grid",
    DataGrid: "DataGrid (from @mui/x-data-grid)",
    Chip: "Chip",
    Avatar: "Avatar",
    Table: "Table, TableBody, TableCell, TableHead, TableRow",
    Dialog: "Dialog, DialogTitle, DialogContent, DialogActions",
    Tabs: "Tabs, Tab",
    Select: "Select, MenuItem",
  },
};
```

Create similar configs for `antd.ts`, `chakra.ts`, `mantine.ts`, and `recharts.ts` following the same pattern. Each config should contain:
- Correct import patterns for the library
- Theming instructions specific to how that library applies colors
- CDN URLs for preview support
- A component map listing available components

---

## 9. Post-Processing Pipeline

### `src/lib/post-process/index.ts`

```typescript
import { extractCode } from "./extract-code";
import { validateImports } from "./validate-imports";
import { validateSyntax } from "./validate-syntax";
import { checkThemeCompliance } from "./theme-compliance";
import { formatCode } from "./formatter";

/**
 * Run the full post-processing pipeline on AI-generated code.
 * Each stage transforms or validates the code.
 */
export async function postProcess(
  rawOutput: string,
  framework: string,
  libraries: string[]
): Promise<string> {
  // Stage 1: Extract code from AI response (strip markdown fences, etc.)
  let code = extractCode(rawOutput);

  // Stage 2: Validate/fix imports against known library component maps
  code = validateImports(code, libraries);

  // Stage 3: Quick syntax validation (check for unclosed tags/brackets)
  const syntaxResult = validateSyntax(code, framework);
  if (!syntaxResult.valid) {
    // Log warning but don't block — let preview show the error
    console.warn("Syntax validation warning:", syntaxResult.errors);
  }

  // Stage 4: Theme compliance check (warn about hardcoded colors)
  const themeResult = checkThemeCompliance(code);
  if (themeResult.warnings.length > 0) {
    console.warn("Theme compliance warnings:", themeResult.warnings);
  }

  // Stage 5: Format with Prettier
  code = await formatCode(code, framework);

  return code;
}
```

### `src/lib/post-process/extract-code.ts`

```typescript
/**
 * Extract code from AI response.
 * Strips markdown fences, explanations, and other non-code text.
 */
export function extractCode(raw: string): string {
  // Try to find code inside markdown fences
  const fenceMatch = raw.match(/```(?:tsx?|jsx?|html|vue|svelte)?\s*\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // If no fences, check if the entire response looks like code
  const trimmed = raw.trim();
  if (
    trimmed.startsWith("import ") ||
    trimmed.startsWith("export ") ||
    trimmed.startsWith("function ") ||
    trimmed.startsWith("const ") ||
    trimmed.startsWith("<") ||
    trimmed.startsWith("<!DOCTYPE")
  ) {
    return trimmed;
  }

  // Last resort: find the first line that looks like code and take everything from there
  const lines = raw.split("\n");
  const codeStartIndex = lines.findIndex(
    (line) =>
      line.trim().startsWith("import ") ||
      line.trim().startsWith("export ") ||
      line.trim().startsWith("function ") ||
      line.trim().startsWith("const ") ||
      line.trim().startsWith("<")
  );

  if (codeStartIndex >= 0) {
    return lines.slice(codeStartIndex).join("\n").trim();
  }

  // Return as-is if we can't determine
  return trimmed;
}
```

### `src/lib/post-process/validate-imports.ts`

```typescript
import { getLibraryConfig } from "@/lib/library-configs";

/**
 * Validate import statements against known library component maps.
 * Fixes common AI hallucinations like wrong package names.
 */
export function validateImports(code: string, libraries: string[]): string {
  let result = code;

  // Common hallucinated import fixes
  const importFixes: Record<string, string> = {
    // Wrong package names AI might use
    'from "material-ui"': 'from "@mui/material"',
    'from "antdesign"': 'from "antd"',
    'from "@chakra/react"': 'from "@chakra-ui/react"',
    'from "shadcn"': 'from "@/components/ui"',
    'from "@shadcn/ui"': 'from "@/components/ui"',
  };

  for (const [wrong, right] of Object.entries(importFixes)) {
    result = result.replace(new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), right);
  }

  return result;
}
```

### `src/lib/post-process/validate-syntax.ts`

```typescript
/**
 * Quick syntax validation — checks for unclosed brackets, tags, etc.
 * Does NOT use a full AST parser (too heavy for quick checks).
 */
export function validateSyntax(
  code: string,
  framework: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check bracket balance
  const brackets: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const stack: string[] = [];
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prev = i > 0 ? code[i - 1] : "";

    // Track strings (skip brackets inside strings)
    if ((char === '"' || char === "'" || char === "`") && prev !== "\\") {
      if (inString && char === stringChar) {
        inString = false;
      } else if (!inString) {
        inString = true;
        stringChar = char;
      }
      continue;
    }

    if (inString) continue;

    if (brackets[char]) {
      stack.push(brackets[char]);
    } else if (Object.values(brackets).includes(char)) {
      if (stack.length === 0 || stack[stack.length - 1] !== char) {
        errors.push(`Unmatched closing bracket '${char}' at position ${i}`);
      } else {
        stack.pop();
      }
    }
  }

  if (stack.length > 0) {
    errors.push(`Unclosed brackets: ${stack.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}
```

### `src/lib/post-process/theme-compliance.ts`

```typescript
/**
 * Check that the code uses palette colors instead of hardcoded hex values.
 * Returns warnings (not errors) — doesn't block generation.
 */
export function checkThemeCompliance(code: string): { warnings: string[] } {
  const warnings: string[] = [];

  // Find hardcoded hex colors that aren't common neutrals
  const hexPattern = /#(?:[0-9a-fA-F]{3}){1,2}/g;
  const neutrals = new Set([
    "#000", "#000000", "#fff", "#ffffff", "#FFF", "#FFFFFF",
    "#f5f5f5", "#F5F5F5", "#e5e5e5", "#E5E5E5",
    "#333", "#333333", "#666", "#666666", "#999", "#999999",
    "#ccc", "#cccccc", "#eee", "#eeeeee",
    "#transparent",
  ]);

  const matches = code.match(hexPattern) || [];
  const nonNeutral = matches.filter((hex) => !neutrals.has(hex.toLowerCase()));

  if (nonNeutral.length > 3) {
    warnings.push(
      `Found ${nonNeutral.length} hardcoded colors (${nonNeutral.slice(0, 3).join(", ")}...). Consider using palette CSS variables.`
    );
  }

  return { warnings };
}
```

### `src/lib/post-process/formatter.ts`

```typescript
import prettier from "prettier";

/**
 * Format code using Prettier.
 */
export async function formatCode(code: string, framework: string): Promise<string> {
  const parserMap: Record<string, string> = {
    REACT: "typescript",
    HTML: "html",
    VUE: "vue",
    SVELTE: "html",
    ANGULAR: "typescript",
  };

  try {
    return await prettier.format(code, {
      parser: parserMap[framework] || "typescript",
      semi: true,
      singleQuote: true,
      trailingComma: "es5",
      printWidth: 100,
      tabWidth: 2,
    });
  } catch {
    // If formatting fails, return as-is
    return code;
  }
}
```

---

## 10. Preview Engine (Custom Wrappers)

### `src/lib/preview/index.ts`

```typescript
import type { PreviewRequest } from "@/types";
import { buildHtmlWrapper } from "./wrappers/html-wrapper";
import { buildReactWrapper } from "./wrappers/react-wrapper";

/**
 * Build a complete HTML document for iframe preview.
 * Selects the appropriate wrapper based on framework.
 */
export function buildPreviewHtml(request: PreviewRequest): string {
  const { framework } = request;

  switch (framework) {
    case "HTML":
      return buildHtmlWrapper(request);
    case "REACT":
      return buildReactWrapper(request);
    default:
      // Phase 1: Only HTML and React supported
      return buildReactWrapper(request); // Fallback to React
  }
}
```

### `src/lib/preview/wrappers/html-wrapper.ts`

```typescript
import type { PreviewRequest } from "@/types";
import { buildPaletteCss } from "../sandbox";
import { getCdnTags } from "../cdn-manager";

export function buildHtmlWrapper(request: PreviewRequest): string {
  const { code, libraries, palette } = request;
  const paletteCss = buildPaletteCss(palette);
  const cdnTags = getCdnTags(libraries, "HTML");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${paletteCss}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--color-background, #ffffff);
      color: var(--color-text, #333333);
    }
  </style>
  ${cdnTags}
</head>
<body>
  ${code}
  <script>
    // Error reporting to parent iframe
    window.onerror = function(msg, url, line, col, error) {
      window.parent.postMessage({
        type: 'preview-error',
        error: { type: 'runtime', message: msg, line: line, column: col }
      }, '*');
    };
  </script>
</body>
</html>`;
}
```

### `src/lib/preview/wrappers/react-wrapper.ts`

```typescript
import type { PreviewRequest } from "@/types";
import { buildPaletteCss } from "../sandbox";
import { getCdnTags } from "../cdn-manager";

export function buildReactWrapper(request: PreviewRequest): string {
  const { code, libraries, palette } = request;
  const paletteCss = buildPaletteCss(palette);
  const cdnTags = getCdnTags(libraries, "REACT");

  // Escape backticks and ${} in user code for safe template literal embedding
  const escapedCode = code
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- React Runtime -->
  <script src="/preview-assets/react.production.min.js"></script>
  <script src="/preview-assets/react-dom.production.min.js"></script>

  <!-- Babel Standalone (in-browser JSX compiler) -->
  <script src="/preview-assets/babel-standalone.min.js"></script>

  <!-- Library CDNs -->
  ${cdnTags}

  <!-- Palette CSS Variables -->
  <style>
    ${paletteCss}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--color-background, #ffffff);
      color: var(--color-text, #333333);
    }
    #preview-error-overlay {
      display: none;
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      color: #ff6b6b;
      padding: 24px;
      font-family: monospace;
      font-size: 14px;
      z-index: 10000;
      overflow: auto;
    }
    #preview-error-overlay h2 { color: #ff6b6b; margin-bottom: 12px; }
    #preview-error-overlay pre { white-space: pre-wrap; color: #ffa8a8; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="preview-error-overlay">
    <h2>Preview Error</h2>
    <pre id="preview-error-message"></pre>
  </div>

  <script type="text/babel" data-presets="react">
    ${code}

    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } catch (err) {
      document.getElementById('preview-error-overlay').style.display = 'block';
      document.getElementById('preview-error-message').textContent = err.message + '\\n\\n' + err.stack;
      window.parent.postMessage({
        type: 'preview-error',
        error: { type: 'runtime', message: err.message }
      }, '*');
    }
  </script>

  <script>
    // Catch Babel compilation errors
    window.addEventListener('error', function(e) {
      if (e.message) {
        document.getElementById('preview-error-overlay').style.display = 'block';
        document.getElementById('preview-error-message').textContent = e.message;
        window.parent.postMessage({
          type: 'preview-error',
          error: { type: 'compile', message: e.message }
        }, '*');
      }
    });
  </script>
</body>
</html>`;
}
```

### `src/lib/preview/cdn-manager.ts`

```typescript
import type { UILibrary } from "@/types";

interface CdnEntry {
  tag: string; // Full HTML tag (script or link)
  frameworks: string[]; // Which frameworks this CDN supports
}

/**
 * CDN registry for UI libraries.
 * Maps library IDs to their CDN script/link tags.
 */
const CDN_REGISTRY: Record<string, CdnEntry[]> = {
  tailwind: [
    {
      tag: '<script src="https://cdn.tailwindcss.com"></script>',
      frameworks: ["HTML", "REACT", "VUE", "SVELTE", "ANGULAR"],
    },
  ],
  mui: [
    {
      tag: '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />',
      frameworks: ["REACT"],
    },
  ],
  antd: [
    {
      tag: '<link rel="stylesheet" href="https://unpkg.com/antd@5/dist/reset.css" />',
      frameworks: ["REACT"],
    },
  ],
  recharts: [
    {
      tag: '<script src="https://unpkg.com/recharts@2/umd/Recharts.js"></script>',
      frameworks: ["REACT"],
    },
  ],
};

/**
 * Generate CDN HTML tags for the given libraries and framework.
 */
export function getCdnTags(libraries: string[], framework: string): string {
  const tags: string[] = [];

  for (const lib of libraries) {
    const entries = CDN_REGISTRY[lib] || [];
    for (const entry of entries) {
      if (entry.frameworks.includes(framework)) {
        tags.push(entry.tag);
      }
    }
  }

  return tags.join("\n  ");
}
```

### `src/lib/preview/sandbox.ts`

```typescript
import type { PaletteColor } from "@/types";

/**
 * Build CSS variable declarations from palette colors.
 */
export function buildPaletteCss(palette: PaletteColor[]): string {
  const variables = palette
    .map((c) => `      --color-${c.role}: ${c.hex};`)
    .join("\n");

  return `:root {\n${variables}\n    }`;
}

/**
 * iframe sandbox attributes for secure preview.
 * allow-scripts: needed for React/Babel compilation
 * allow-same-origin: needed for CDN loading (but sandboxed domain)
 */
export const IFRAME_SANDBOX = "allow-scripts allow-same-origin";

/**
 * CSP meta tag for preview iframes.
 */
export const PREVIEW_CSP = `
  default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
`;
```

### `src/lib/preview/error-handler.ts`

```typescript
import type { PreviewError } from "@/types";

/**
 * Parse preview error messages from the iframe's postMessage.
 */
export function parsePreviewError(event: MessageEvent): PreviewError | null {
  if (event.data?.type !== "preview-error") return null;
  return event.data.error as PreviewError;
}

/**
 * Build an auto-fix prompt from a preview error.
 */
export function buildFixPrompt(error: PreviewError): string {
  const parts = [`The preview shows this error: ${error.message}`];
  if (error.line) parts.push(`at line ${error.line}`);
  parts.push("Please fix the code.");
  return parts.join(" ");
}
```

---

## 11. Marp Integration

### `src/lib/marp/theme-injector.ts`

```typescript
import type { PaletteColor, SlideTheme } from "@/types";
import fs from "fs";
import path from "path";

const TEMPLATES_DIR = path.join(process.cwd(), "src/lib/marp/templates");

/**
 * Load a base Marp theme template and inject palette colors.
 * Returns the CSS block to embed in the Marp markdown <style> section.
 */
export function injectPaletteIntoTheme(
  palette: PaletteColor[],
  theme: SlideTheme
): string {
  // Build CSS variables from palette
  const cssVariables = palette
    .map((c) => `  --color-${c.role}: ${c.hex};`)
    .join("\n");

  // Theme-specific base styles
  const themeStyles = getThemeStyles(theme, palette);

  return `<style>
:root {
${cssVariables}
}
${themeStyles}
</style>`;
}

function getThemeStyles(theme: SlideTheme, palette: PaletteColor[]): string {
  const getColor = (role: string, fallback: string) => {
    const found = palette.find((c) => c.role === role);
    return found ? found.hex : fallback;
  };

  const primary = getColor("primary", "#1E2761");
  const secondary = getColor("secondary", "#CADCFC");
  const accent = getColor("accent", "#F96167");
  const background = getColor("background", "#FFFFFF");
  const text = getColor("text", "#333333");
  const surface = getColor("surface", "#F5F5F5");

  const baseSection = `
section {
  background: ${background};
  color: ${text};
  font-family: 'Segoe UI', system-ui, sans-serif;
}
section h1, section h2 { color: ${primary}; }
section h3, section h4 { color: ${primary}; }
section a { color: ${accent}; }
section strong { color: ${accent}; }
section code { background: ${surface}; padding: 2px 6px; border-radius: 4px; }
section blockquote { border-left: 4px solid ${accent}; padding-left: 16px; color: ${text}; }
`;

  switch (theme) {
    case "business":
      return `${baseSection}
section { border-top: 4px solid ${primary}; }
section.lead { background: ${primary}; color: ${secondary}; }
section.lead h1 { color: #ffffff; }
section.lead h2 { color: ${secondary}; }`;

    case "dark":
      return `
section { background: ${primary}; color: ${secondary}; }
section h1, section h2 { color: #ffffff; }
section h3 { color: ${accent}; }
section a { color: ${accent}; }
section strong { color: ${accent}; }
section code { background: rgba(255,255,255,0.1); color: ${accent}; }
section.lead { background: linear-gradient(135deg, ${primary} 0%, #000000 100%); }
section.lead h1 { color: ${accent}; }`;

    case "tech":
      return `${baseSection}
section { font-family: 'SF Mono', 'Fira Code', monospace; }
section h1::before { content: "# "; color: ${accent}; }
section code { background: ${primary}; color: ${accent}; }
section pre { background: ${primary}; border-radius: 8px; padding: 16px; }`;

    case "minimal":
      return `${baseSection}
section { padding: 60px 80px; }
section h1 { font-weight: 300; font-size: 2.5em; }
section h2 { font-weight: 300; font-size: 1.8em; color: ${text}; }`;

    case "colorful":
      return `
section { background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%); color: #ffffff; }
section h1 { color: #ffffff; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
section h2 { color: ${secondary}; }
section a { color: ${secondary}; }
section code { background: rgba(255,255,255,0.2); color: #ffffff; }`;

    case "gradient":
      return `
section { background: linear-gradient(180deg, ${background} 0%, ${secondary} 100%); color: ${text}; }
section h1, section h2 { color: ${primary}; }
section.lead { background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%); color: #ffffff; }
section.lead h1 { color: #ffffff; }`;

    case "default":
    default:
      return baseSection;
  }
}

/**
 * Check contrast ratio between text and background colors.
 * Returns true if contrast is >= 4.5:1 (WCAG AA).
 */
export function checkContrast(hex1: string, hex2: string): boolean {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  return ratio >= 4.5;
}

function getLuminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((c) => {
      const val = parseInt(c, 16) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
```

### `src/lib/marp/marp-export.ts`

```typescript
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync } from "fs";
import path from "path";
import type { ExportFormat } from "@/types";

const TMP_DIR = path.join(process.cwd(), ".tmp/marp");

/**
 * Export Marp markdown to PPTX, PDF, or HTML using Marp CLI.
 */
export async function exportMarp(
  markdown: string,
  format: ExportFormat
): Promise<Buffer> {
  // Ensure tmp directory exists
  mkdirSync(TMP_DIR, { recursive: true });

  const inputPath = path.join(TMP_DIR, `slide-${Date.now()}.md`);
  const outputPath = path.join(TMP_DIR, `slide-${Date.now()}.${format}`);

  try {
    // Write markdown to temp file
    writeFileSync(inputPath, markdown, "utf-8");

    // Build Marp CLI command
    const formatFlag = format === "pptx" ? "--pptx" : format === "pdf" ? "--pdf" : "--html";
    const cmd = `npx @marp-team/marp-cli ${inputPath} ${formatFlag} -o ${outputPath} --allow-local-files`;

    execSync(cmd, {
      timeout: 30000,
      stdio: "pipe",
    });

    // Read output file
    const buffer = readFileSync(outputPath);
    return buffer;
  } finally {
    // Cleanup temp files
    try { unlinkSync(inputPath); } catch {}
    try { unlinkSync(outputPath); } catch {}
  }
}
```

### `src/lib/marp/marp-preview.ts`

```typescript
import { Marp } from "@marp-team/marp-core";

/**
 * Render Marp markdown to HTML for iframe preview.
 * Uses @marp-team/marp-core directly (no CLI needed for preview).
 */
export async function previewMarp(markdown: string): Promise<string> {
  const marp = new Marp({
    html: true,
    math: false,
  });

  const { html, css } = marp.render(markdown);

  // Wrap in a complete HTML document
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
  <style>
    /* Slide navigation controls */
    body { margin: 0; overflow: hidden; }
    .marpit { display: flex; flex-direction: column; align-items: center; }
    .marpit > svg { max-width: 100%; height: auto; }

    /* Show one slide at a time */
    .marpit > svg { display: none; }
    .marpit > svg.active { display: block; }

    .slide-nav {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; align-items: center;
      background: rgba(0,0,0,0.7); padding: 8px 16px; border-radius: 20px;
      color: white; font-family: system-ui; font-size: 14px; z-index: 100;
    }
    .slide-nav button {
      background: rgba(255,255,255,0.2); border: none; color: white;
      padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;
    }
    .slide-nav button:hover { background: rgba(255,255,255,0.3); }
  </style>
</head>
<body>
  ${html}
  <div class="slide-nav">
    <button onclick="navigate(-1)">◀ Prev</button>
    <span id="slide-counter">1 / 1</span>
    <button onclick="navigate(1)">Next ▶</button>
  </div>
  <script>
    let current = 0;
    const slides = document.querySelectorAll('.marpit > svg');
    const counter = document.getElementById('slide-counter');

    function showSlide(index) {
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
      counter.textContent = (index + 1) + ' / ' + slides.length;
      window.parent.postMessage({ type: 'slide-change', slide: index, total: slides.length }, '*');
    }

    function navigate(delta) {
      current = Math.max(0, Math.min(slides.length - 1, current + delta));
      showSlide(current);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });

    // Initialize
    if (slides.length > 0) showSlide(0);
  </script>
</body>
</html>`;
}
```

### Marp Templates

Create 7 template files in `src/lib/marp/templates/`. Each is a Marp markdown file demonstrating the theme's style. These are used as **reference examples** in the AI prompt to show the model what that theme looks like.

Example: `src/lib/marp/templates/business.md`

```markdown
---
marp: true
theme: default
paginate: true
---

<!-- _class: lead -->

# Presentation Title

## Subtitle — Company Name

---

## Agenda

- **Topic One** — Brief description
- **Topic Two** — Brief description
- **Topic Three** — Brief description
- **Topic Four** — Brief description

---

## Key Metrics

| Metric | Value | Change |
|--------|-------|--------|
| Revenue | $2.4M | +12% |
| Users | 48K | +28% |
| NPS | 72 | +5 |

---

## Next Steps

1. **Phase 1** — Implementation
2. **Phase 2** — Testing
3. **Phase 3** — Launch

---

<!-- _class: lead -->

# Thank You

Questions?
```

Create similar templates for `default.md`, `minimal.md`, `colorful.md`, `dark.md`, `gradient.md`, and `tech.md` — each showcasing that theme's slide patterns and content style.

---

## 12. Parsers

### `src/lib/parsers/css-parser.ts`

```typescript
import type { PaletteColor, ColorRole } from "@/types";

/**
 * Parse CSS text and extract color values with role assignments.
 * Handles: CSS variables, named properties (background, color, border-color).
 */
export function parseCssToColors(css: string): PaletteColor[] {
  const colors: PaletteColor[] = [];
  const seen = new Set<string>();

  // 1. Extract CSS custom properties (--primary, --color-accent, etc.)
  const varPattern = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g;
  let match: RegExpExecArray | null;

  while ((match = varPattern.exec(css)) !== null) {
    const name = match[1].toLowerCase();
    const value = normalizeColor(match[2]);
    if (value && !seen.has(value)) {
      seen.add(value);
      colors.push({ hex: value, role: inferRole(name), order: colors.length });
    }
  }

  // 2. Extract from property values (background, color, border-color, etc.)
  const propPattern = /(?:background(?:-color)?|color|border(?:-color)?|fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8})/g;

  while ((match = propPattern.exec(css)) !== null) {
    const value = normalizeColor(match[1]);
    if (value && !seen.has(value)) {
      seen.add(value);
      colors.push({ hex: value, role: "primary", order: colors.length });
    }
  }

  return colors;
}

/**
 * Normalize color values to 6-digit hex.
 */
function normalizeColor(value: string): string | null {
  if (value.startsWith("#")) {
    const hex = value.replace("#", "");
    if (hex.length === 3) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
    }
    if (hex.length === 6) return `#${hex.toUpperCase()}`;
    if (hex.length === 8) return `#${hex.slice(0, 6).toUpperCase()}`; // Strip alpha
  }
  return null; // Skip rgba() for now
}

/**
 * Infer a semantic role from a CSS variable name.
 */
function inferRole(name: string): ColorRole {
  const roleMap: Record<string, ColorRole> = {
    primary: "primary",
    secondary: "secondary",
    accent: "accent",
    background: "background",
    bg: "background",
    text: "text",
    foreground: "text",
    surface: "surface",
    border: "border",
    success: "success",
    warning: "warning",
    error: "error",
    danger: "error",
    info: "info",
  };

  for (const [keyword, role] of Object.entries(roleMap)) {
    if (name.includes(keyword)) return role;
  }

  return "primary"; // Default role
}
```

### `src/lib/parsers/swagger-parser.ts`

```typescript
import type { ParsedEndpoint, SwaggerParseResult } from "@/types";

/**
 * Parse an OpenAPI 3.x spec (JSON string) into structured endpoint data.
 */
export function parseOpenApiSpec(specStr: string): SwaggerParseResult {
  const spec = JSON.parse(specStr);
  const info = spec.info || {};
  const paths = spec.paths || {};

  const endpoints: ParsedEndpoint[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods as Record<string, any>)) {
      if (["get", "post", "put", "delete", "patch"].includes(method)) {
        const op = operation as any;

        // Determine suggested UI type
        const suggestedUI = suggestUIType(method, op);

        // Extract request body schema
        const requestSchema =
          op.requestBody?.content?.["application/json"]?.schema || null;

        // Extract response schema (200 or 201)
        const successResponse = op.responses?.["200"] || op.responses?.["201"];
        const responseSchema =
          successResponse?.content?.["application/json"]?.schema || null;

        // Extract parameters
        const parameters = (op.parameters || []).map((p: any) => ({
          name: p.name,
          in: p.in,
          required: p.required || false,
          schema: p.schema || {},
        }));

        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: op.summary || op.description || "",
          suggestedUI,
          requestSchema,
          responseSchema,
          parameters,
        });
      }
    }
  }

  return {
    name: info.title || "Untitled API",
    version: info.version || "1.0.0",
    endpoints,
  };
}

/**
 * Suggest a UI type based on the HTTP method and response schema.
 */
function suggestUIType(method: string, operation: any): string {
  const responseSchema =
    operation.responses?.["200"]?.content?.["application/json"]?.schema;
  const hasRequestBody = !!operation.requestBody;
  const hasQueryParams = (operation.parameters || []).some(
    (p: any) => p.in === "query"
  );

  switch (method) {
    case "get":
      if (responseSchema?.type === "array" || responseSchema?.items) {
        return hasQueryParams ? "filter-table" : "table";
      }
      return "detail";
    case "post":
      return hasRequestBody ? "form" : "detail";
    case "put":
    case "patch":
      return "form";
    case "delete":
      return "dialog";
    default:
      return "detail";
  }
}
```

---

## 13. Components

### 13.1 Component Interface Specifications

Each component below lists its props, internal state, and key behaviors. Implement using shadcn/ui primitives + Tailwind CSS.

---

#### `src/components/layout/Navbar.tsx`

```typescript
interface NavbarProps {
  // No props — reads from context/route
}

// Behavior:
// - Fixed top nav, dark bg (jedith-navy)
// - Logo (EDITH glasses SVG + "JEdithUI" text) on the left
// - Navigation links: Dashboard, Palettes, Chats, Presentations, Swagger
// - Active link indicator (coral underline)
// - Right side: Ollama status badge (green/red/yellow dot + text)
```

#### `src/components/layout/OllamaStatus.tsx`

```typescript
interface OllamaStatusProps {
  // No props — fetches status from /api/models using SWR
}

// Behavior:
// - Polls /api/models every 30 seconds via SWR
// - Shows: 🟢 Connected · {count} models · Default: {name}
//          🔴 Disconnected
//          🟡 Connected · No models
// - Clicking opens a dropdown showing all installed models
```

#### `src/components/layout/Logo.tsx`

```typescript
interface LogoProps {
  size?: "sm" | "md" | "lg"; // Default: "md"
}

// Renders the EDITH glasses SVG logo + "JEdithUI" text
// Brand colors: navy (#1E2761), ice (#CADCFC), coral (#F96167)
```

---

#### `src/components/palette/PaletteCard.tsx`

```typescript
interface PaletteCardProps {
  palette: PaletteData;
  onCodeClick: (paletteId: string) => void;   // Navigate to new code chat
  onSlidesClick: (paletteId: string) => void;  // Navigate to new presentation
  onEdit: (paletteId: string) => void;
  onDelete: (paletteId: string) => void;
}

// Behavior:
// - Card showing palette name, source badge (IMAGE/CSS/MANUAL), color swatches
// - Color swatches are circles showing the first 5-7 colors
// - Two primary action buttons at the bottom: [Code] [Slides]
// - Overflow menu (three dots): Edit, Delete
// - Hover: subtle shadow elevation
```

#### `src/components/palette/PaletteEditor.tsx`

```typescript
interface PaletteEditorProps {
  palette?: PaletteData;        // Existing palette (edit mode) or undefined (create mode)
  onSave: (palette: Omit<PaletteData, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

// Behavior:
// - Name input field
// - Source selector (disabled in edit mode, set in create mode)
// - Color list: each row = color swatch circle + hex input + role dropdown + delete button
// - Add Color button (max 20 colors)
// - Color picker (native or custom) for each color
// - Role dropdown options: primary, secondary, accent, background, text, surface, border, success, warning, error, info
// - Drag to reorder colors
// - Save / Cancel buttons
```

#### `src/components/palette/ColorSwatch.tsx`

```typescript
interface ColorSwatchProps {
  hex: string;
  role?: string;
  size?: "sm" | "md" | "lg"; // Default: "md"
  showLabel?: boolean;         // Show role name below swatch
  onClick?: () => void;
}

// Renders a circular color swatch with optional role label
```

#### `src/components/palette/ImageDropzone.tsx`

```typescript
interface ImageDropzoneProps {
  onImageSelect: (base64: string) => void;
  isLoading?: boolean;
}

// Behavior:
// - Uses react-dropzone for drag-and-drop
// - Accepts: PNG, JPG, WEBP (max 10MB)
// - Shows preview thumbnail after selection
// - Loading state while AI extracts colors
```

---

#### `src/components/generator/ModelSelector.tsx`

```typescript
interface ModelSelectorProps {
  value: string;                // Selected model name
  onChange: (model: string) => void;
  filterVision?: boolean;       // Only show vision-capable models (for image tasks)
}

// Behavior:
// - Dropdown listing all installed Ollama models
// - Fetches from /api/models via useOllamaModels() hook
// - Each option shows: icon/badge, model name, parameter size, quantization
// - Badges: ⭐ Recommended, 🖼️ Vision, 💻 Code, 🧠 Large
// - When filterVision=true, only shows vision-capable models
// - If Ollama disconnected: shows "Ollama not running" with instructions
// - If no models: shows "No models installed" with `ollama pull` instructions
```

#### `src/components/generator/FrameworkSelector.tsx`

```typescript
interface FrameworkSelectorProps {
  value: Framework;
  onChange: (framework: Framework) => void;
}

// Simple dropdown: React (default), Vue, Svelte, Angular, HTML
// Phase 1: Only React and HTML are fully functional (others show "Coming Soon" badge)
```

#### `src/components/generator/LibrarySelector.tsx`

```typescript
interface LibrarySelectorProps {
  value: UILibrary[];
  onChange: (libraries: UILibrary[]) => void;
  framework: Framework; // Filter libraries by framework compatibility
}

// Behavior:
// - Multi-select checkboxes for UI libraries
// - Libraries: Tailwind CSS, shadcn/ui, Material UI, Ant Design, Chakra UI, Mantine, Recharts, React Table
// - The first selected library is the "primary" (shown with star icon)
// - Drag to reorder priority
// - Show library icon/logo next to each name
// - Disable libraries incompatible with selected framework
```

#### `src/components/generator/SlideThemeSelector.tsx`

```typescript
interface SlideThemeSelectorProps {
  value: SlideTheme;
  onChange: (theme: SlideTheme) => void;
  palette: PaletteColor[]; // Used to preview theme in palette's colors
}

// Behavior:
// - Grid of 7 theme cards (2-3 per row)
// - Each card shows: theme name, description, mini preview swatch using palette colors
// - Selected theme has highlighted border (coral accent)
// - Themes: Default, Minimal, Colorful, Dark, Gradient, Tech, Business
```

#### `src/components/generator/ThemeSelector.tsx`

```typescript
interface ThemeSelectorProps {
  value: string;
  onChange: (paletteId: string) => void;
  palettes: PaletteData[]; // Available palettes
}

// Dropdown showing user's palettes with color swatch preview strips
```

#### `src/components/generator/PromptInput.tsx`

```typescript
interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

// Behavior:
// - Textarea with auto-resize
// - Submit button (arrow icon) on the right side
// - Ctrl+Enter or click to submit
// - Disabled + spinner during generation
// - Placeholder text changes based on context:
//   - New code chat: "Describe the UI you want to generate..."
//   - Refinement: "Describe changes to make..."
//   - New presentation: "Describe the presentation content..."
```

#### `src/components/generator/ApiResponseInput.tsx`

```typescript
interface ApiResponseInputProps {
  onSubmit: (jsonResponses: string[], prompt: string) => void;
  isLoading: boolean;
}

// Behavior:
// - JSON textarea (monospace font, syntax highlighting optional)
// - "Add another sample" button (allows multi-sample for smarter inference)
// - Text prompt field for UI instructions ("Create a data table with filters")
// - JSON validation on paste (highlights errors)
```

---

#### `src/components/chat/ChatThread.tsx`

```typescript
interface ChatThreadProps {
  chatId: string;
  // Fetches all data internally from /api/chat/[id]
}

// Behavior:
// - The main chat UI — used for BOTH code and presentation chats
// - Header: chat name (editable), palette swatches, framework/theme badge, model badge
// - Message list: alternating user/assistant bubbles
// - For assistant messages: show code preview or slide preview (depending on chat type)
// - Version timeline bar at the bottom of each assistant message
// - Prompt input at the bottom
// - Auto-scroll to latest message
// - Loading state: typing indicator while generating
```

#### `src/components/chat/MessageBubble.tsx`

```typescript
interface MessageBubbleProps {
  message: MessageData;
  chatType: ChatType;
  palette: PaletteColor[];
  framework?: Framework;
  libraries?: UILibrary[];
}

// Behavior:
// - USER messages: right-aligned, simple text, light bg
// - ASSISTANT messages: left-aligned, content text + preview panel
//   - If code chat: show CodePreview component
//   - If presentation chat: show SlidePreview + SlideFilmstrip
// - Show model badge on assistant messages (which model generated it)
// - Timestamp on hover
```

#### `src/components/chat/CodePreview.tsx`

```typescript
interface CodePreviewProps {
  code: string;
  framework: Framework;
  libraries: UILibrary[];
  palette: PaletteColor[];
  onError?: (error: PreviewError) => void;
}

// Behavior:
// - Tabbed view: [Preview] [Code]
// - Preview tab: sandboxed iframe rendering the code
//   - Calls /api/preview to get the wrapped HTML
//   - Sets iframe srcdoc with the preview HTML
//   - Listens for postMessage errors from iframe
//   - Shows error overlay with [Fix this error] button on failure
// - Code tab: syntax-highlighted code block
//   - Copy to clipboard button
//   - Language badge (tsx, html, etc.)
// - Resize handle to adjust preview height
```

#### `src/components/chat/SlidePreview.tsx`

```typescript
interface SlidePreviewProps {
  markdown: string;
  slideCount: number;
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onError?: (error: string) => void;
}

// Behavior:
// - Sandboxed iframe rendering Marp HTML
//   - Calls /api/presentation/preview to get rendered HTML
//   - Sets iframe srcdoc
// - Navigation: Prev/Next buttons, current slide indicator (1 of 5)
// - Listens for 'slide-change' postMessage from iframe
// - Aspect ratio: 16:9 (fixed)
```

#### `src/components/chat/SlideFilmstrip.tsx`

```typescript
interface SlideFilmstripProps {
  slideCount: number;
  currentSlide: number;
  onSlideClick: (index: number) => void;
}

// Behavior:
// - Horizontal scrollable strip of slide thumbnails
// - Each thumbnail is a numbered mini-rectangle
// - Active slide has highlighted border
// - Click to navigate to that slide
```

#### `src/components/chat/VersionTimeline.tsx`

```typescript
interface VersionTimelineProps {
  versions: Array<{
    version: number;
    modelName: string;
    createdAt: string;
  }>;
  currentVersion: number;
  onVersionClick: (version: number) => void;
  onFork: (version: number) => void;
}

// Behavior:
// - Horizontal dot timeline: [v1] -> [v2] -> [v3 current]
// - Each dot shows version number
// - Hover shows: model name, timestamp
// - Click to restore that version's preview
// - Right-click or long-press for [Fork from here]
// - Current version dot is highlighted (coral)
```

#### `src/components/chat/ExportButtons.tsx`

```typescript
interface ExportButtonsProps {
  chatType: ChatType;

  // For code chats:
  code?: string;
  language?: string;

  // For presentation chats:
  markdown?: string;
}

// Behavior:
// CODE chats: [📋 Copy Code] [📥 Download .tsx/.html]
// PRESENTATION chats: [📥 PPTX] [📄 PDF] [🔗 HTML] [📋 Markdown]
// - PPTX/PDF/HTML buttons call /api/presentation/export
// - Show loading spinner during export
// - Download triggers browser file download
```

---

#### `src/components/swagger/SpecImporter.tsx`

```typescript
interface SpecImporterProps {
  onImport: (result: SwaggerParseResult) => void;
}

// Behavior:
// - Two input modes:
//   1. Paste JSON/YAML directly into a textarea
//   2. Enter a URL to fetch from
// - [Import] button triggers /api/swagger parsing
// - Shows loading state during parsing
// - Shows error if spec is invalid
```

#### `src/components/swagger/EndpointBrowser.tsx`

```typescript
interface EndpointBrowserProps {
  result: SwaggerParseResult;
  onGenerateUI: (endpoint: ParsedEndpoint, palette: PaletteData) => void;
}

// Behavior:
// - Grouped list of endpoints by resource (first path segment)
// - Each endpoint shows: method badge (GET=green, POST=blue, etc.), path, summary
// - Suggested UI type badge (table, form, detail, dialog)
// - [Generate UI] button per endpoint → opens chat creation flow
// - "Related endpoints" grouping (e.g., GET/POST/PUT on same resource)
```

---

### 13.2 Custom Hooks

#### `src/hooks/useOllamaModels.ts`

```typescript
import useSWR from "swr";
import type { OllamaModelWithBadges, OllamaStatus } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useOllamaModels() {
  const { data, error, isLoading, mutate } = useSWR("/api/models", fetcher, {
    refreshInterval: 30000, // Poll every 30s
    revalidateOnFocus: true,
  });

  return {
    models: (data?.models || []) as OllamaModelWithBadges[],
    status: (data?.status || { connected: false, modelCount: 0, defaultModel: null }) as OllamaStatus,
    isLoading,
    error,
    refresh: mutate,
  };
}
```

#### `src/hooks/usePalettes.ts`

```typescript
import useSWR from "swr";
import type { PaletteData } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePalettes(sessionId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    sessionId ? `/api/palettes?sessionId=${sessionId}` : null,
    fetcher
  );

  return {
    palettes: (data?.palettes || []) as PaletteData[],
    isLoading,
    error,
    refresh: mutate,
  };
}
```

#### `src/hooks/useChat.ts`

```typescript
import useSWR from "swr";
import { useState, useCallback } from "react";
import type { ChatData, MessageData } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useChat(chatId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    chatId ? `/api/chat/${chatId}` : null,
    fetcher
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const chat = data?.chat as ChatData | undefined;
  const messages = (data?.chat?.messages || []) as MessageData[];

  const generate = useCallback(async (prompt: string, modelOverride?: string) => {
    if (!chatId || !chat) return;
    setIsGenerating(true);

    try {
      const endpoint = chat.type === "CODE" ? "/api/generate" : "/api/presentation/generate";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, prompt, modelName: modelOverride }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Revalidate to get fresh messages
      mutate();
      return result;
    } finally {
      setIsGenerating(false);
    }
  }, [chatId, chat, mutate]);

  return {
    chat,
    messages,
    isLoading,
    isGenerating,
    error,
    generate,
    refresh: mutate,
  };
}
```

#### `src/hooks/usePreview.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import type { Framework, UILibrary, PaletteColor, PreviewError } from "@/types";

export function usePreview() {
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PreviewError | null>(null);

  const buildPreview = useCallback(async (
    code: string,
    framework: Framework,
    libraries: UILibrary[],
    palette: PaletteColor[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, framework, libraries, palette }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreviewHtml(data.html);
    } catch (err) {
      setError({
        type: "compile",
        message: err instanceof Error ? err.message : "Preview failed",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for iframe postMessage errors
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "preview-error") {
        setError(event.data.error);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return { previewHtml, isLoading, error, buildPreview, clearError: () => setError(null) };
}
```

---

## 14. Pages & Layouts

### `src/app/layout.tsx`

```typescript
// Root layout with Navbar, font imports, and global styles.
// Brand font: Geist Sans + Geist Mono (from next/font/google or local)
// Global providers: none in Phase 1 (no auth context)

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "JEdithUI — AI Theme-Aware Code Generator",
  description: "Scan. Theme. Generate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Navbar />
        <main className="container mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
```

### `src/app/page.tsx` — Dashboard

```typescript
// Dashboard page — the landing page.
//
// Sections (top to bottom):
// 1. Hero: JEdithUI logo + tagline + stats (total palettes, chats, presentations)
// 2. Quick Actions: cards for [New Palette], [New Code Chat], [New Presentation], [Import Swagger]
// 3. My Palettes: grid of PaletteCard components (with [Code] and [Slides] buttons)
// 4. My Chats (Code): list of recent code chats with metadata badges
// 5. My Presentations: list of recent presentation chats with theme/export badges
// 6. Swagger Imports: list of imported specs with endpoint counts
// 7. Footer: Ollama connection status bar
//
// Uses session ID from localStorage: useEffect to read/generate sessionId on mount.
// All data fetched via SWR hooks (usePalettes, etc.)
// All sections link to their respective pages.
```

### `src/app/palettes/page.tsx` — Palette List

```typescript
// Full palette management page.
// - Grid of PaletteCard components
// - [+ Create Palette] button → opens PaletteEditor in a Dialog
// - Three creation tabs: Upload Image, Paste CSS, Manual
//   - Upload Image: ImageDropzone → ModelSelector (vision models only) → Extract → Edit → Save
//   - Paste CSS: textarea → Parse → Edit → Save
//   - Manual: PaletteEditor directly
```

### `src/app/palettes/[id]/page.tsx` — Palette Detail

```typescript
// Palette detail/edit page.
// - PaletteEditor in edit mode
// - Preview strip showing all colors with roles
// - Associated chats list (code chats + presentations using this palette)
// - Delete palette button (with confirmation dialog)
```

### `src/app/chat/[id]/page.tsx` — Code Chat Thread

```typescript
// Code generation chat page.
// - Full ChatThread component for code generation
// - Header: chat name, palette, framework badge, libraries badges, model selector
// - Messages with CodePreview (iframe preview + code tab)
// - VersionTimeline at the bottom
// - PromptInput for refinements
// - Settings panel (slide-out): change framework, libraries, model
// - ExportButtons: Copy Code, Download
```

### `src/app/presentations/[id]/page.tsx` — Presentation Chat

```typescript
// Presentation chat page.
// - Full ChatThread component for presentations
// - Header: chat name, palette, slide theme badge, model selector
// - Messages with SlidePreview (iframe) + SlideFilmstrip
// - VersionTimeline at the bottom
// - PromptInput for refinements
// - ExportButtons: PPTX, PDF, HTML, Markdown
// - If linked to a code chat: show link badge
```

---

## 15. Build Order

Follow this order strictly. Each phase builds on the previous one.

### Phase 1A: Foundation (Do this first)

```
1. Run project init commands (Section 1.1 + 1.2)
2. Create directory structure (Section 1.4)
3. Configure .env, next.config.ts, tailwind.config.ts (Section 2)
4. Write Prisma schema → run `npx prisma db push && npx prisma generate` (Section 3)
5. Create src/types/index.ts (Section 4)
6. Create src/lib/db.ts + src/lib/utils.ts (Section 5)
7. Create src/lib/ollama.ts (Section 5)
```

### Phase 1B: API Layer

```
8.  GET /api/models (Section 6.1)
9.  GET/POST /api/palettes + /api/palettes/[id] (Section 6.2 + 6.3)
10. POST /api/parse-css (Section 6.5)
11. POST /api/extract-theme (Section 6.4)
12. GET/POST /api/chat + /api/chat/[id] + messages (Section 6.6)
13. POST /api/generate (Section 6.7) — requires: prompts (step 14), post-process (step 15)
14. Create prompt templates: system.ts, theme.ts, refinement.ts (Section 7)
15. Create post-processing pipeline (Section 9)
16. Create library configs (Section 8) — at minimum: tailwind.ts, shadcn.ts
```

### Phase 1C: Preview Engine

```
17. Create preview wrappers: html-wrapper.ts, react-wrapper.ts (Section 10)
18. Create cdn-manager.ts, sandbox.ts, error-handler.ts (Section 10)
19. Create preview/index.ts (Section 10)
20. POST /api/preview (Section 6.11)
21. Download preview assets to public/preview-assets/ (Section 1.3)
```

### Phase 1D: UI Components

```
22. Layout components: Logo.tsx, Navbar.tsx, OllamaStatus.tsx (Section 13)
23. Hooks: useOllamaModels.ts, usePalettes.ts, useChat.ts, usePreview.ts (Section 13.2)
24. Palette components: ColorSwatch.tsx, PaletteCard.tsx, PaletteEditor.tsx, ImageDropzone.tsx
25. Generator components: ModelSelector.tsx, FrameworkSelector.tsx, LibrarySelector.tsx, ThemeSelector.tsx, PromptInput.tsx
26. Chat components: ChatThread.tsx, MessageBubble.tsx, CodePreview.tsx, VersionTimeline.tsx, ExportButtons.tsx
```

### Phase 1E: Pages

```
27. Root layout (src/app/layout.tsx)
28. Dashboard page (src/app/page.tsx)
29. Palette pages (list + detail/edit)
30. Code chat page (src/app/chat/[id]/page.tsx)
```

### Phase 1F: Testing & Polish

```
31. Manual test: create palette → start code chat → generate → preview → refine
32. Fix any preview wrapper issues
33. Add loading states, error boundaries, empty states
34. Responsive layout adjustments
```

### Phase 2.5: Marp Presentations

```
35. Create Marp templates (7 theme markdown files) (Section 11)
36. Create theme-injector.ts, marp-export.ts, marp-preview.ts (Section 11)
37. Create prompt templates: system-slides.ts, marp-syntax.ts (Section 7.2)
38. POST /api/presentation/generate (Section 6.8)
39. POST /api/presentation/export (Section 6.9)
40. POST /api/presentation/preview (Section 6.10)
41. UI: SlideThemeSelector.tsx, SlidePreview.tsx, SlideFilmstrip.tsx
42. Presentation pages (list + chat thread)
43. Add [Slides] button to PaletteCard
```

### Phase 2: API/Swagger

```
44. Create swagger-parser.ts (Section 12)
45. POST /api/swagger (Section 6.12)
46. UI: SpecImporter.tsx, EndpointBrowser.tsx, EndpointCard.tsx
47. Swagger page
48. ApiResponseInput.tsx component
```

---

## Appendix A: AI Generation Functions

### `src/lib/ai/generate-code.ts`

```typescript
import { chat } from "@/lib/ollama";
import {
  buildSystemPrompt,
  buildLibraryPrompt,
  buildThemePrompt,
} from "./prompts/system";
import { buildCodeRefinement } from "./prompts/refinement";
import type { PaletteColor, UILibrary } from "@/types";

interface GenerateCodeParams {
  model: string;
  prompt: string;
  latestCode: string | null;
  palette: PaletteColor[];
  framework: string;
  libraries: string[];
}

export async function generateCode(params: GenerateCodeParams): Promise<string> {
  const { model, prompt, latestCode, palette, framework, libraries } = params;

  // Build the 4-layer prompt
  const systemMessage = [
    buildSystemPrompt(framework),
    buildLibraryPrompt(libraries as UILibrary[]),
    buildThemePrompt(palette),
  ].join("\n");

  // If latestCode exists, this is a refinement — send code + instruction
  const userMessage = latestCode
    ? buildCodeRefinement(latestCode, prompt)
    : prompt;

  const response = await chat(model, [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ]);

  return response.message.content;
}
```

### `src/lib/ai/generate-slides.ts`

```typescript
import { chat } from "@/lib/ollama";
import {
  buildSlideSystemPrompt,
  buildMarpSyntaxPrompt,
  buildSlideThemePrompt,
} from "./prompts/system-slides";
import { buildSlideRefinement } from "./prompts/refinement";
import { injectPaletteIntoTheme } from "@/lib/marp/theme-injector";
import type { PaletteColor, SlideTheme } from "@/types";

interface GenerateSlidesParams {
  model: string;
  prompt: string;
  latestMarkdown: string | null;
  palette: PaletteColor[];
  slideTheme: string;
}

export async function generateSlides(params: GenerateSlidesParams): Promise<string> {
  const { model, prompt, latestMarkdown, palette, slideTheme } = params;

  const themeCSS = injectPaletteIntoTheme(palette, slideTheme as SlideTheme);

  const systemMessage = [
    buildSlideSystemPrompt(),
    buildMarpSyntaxPrompt(),
    buildSlideThemePrompt(palette, slideTheme),
    `\nThe user's theme CSS block to embed in the presentation:\n${themeCSS}`,
  ].join("\n");

  const userMessage = latestMarkdown
    ? buildSlideRefinement(latestMarkdown, prompt)
    : prompt;

  const response = await chat(model, [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ]);

  return response.message.content;
}
```

### `src/lib/ai/extract-colors.ts`

```typescript
import { analyzeImage } from "@/lib/ollama";
import type { PaletteColor } from "@/types";

const EXTRACTION_PROMPT = `Analyze this website screenshot/design and extract the color palette.
Return a JSON array of colors with their semantic roles.

Rules:
- Extract 5-10 distinct colors that define the visual identity.
- Assign roles: "primary", "secondary", "accent", "background", "text", "surface", "border"
- Also assign semantic roles if present: "success", "warning", "error", "info"
- Use exact hex values (e.g., "#1E2761").
- Order by visual prominence (most dominant first).

Return ONLY valid JSON in this exact format, no other text:
[
  { "hex": "#1E2761", "role": "primary", "order": 0 },
  { "hex": "#CADCFC", "role": "secondary", "order": 1 }
]`;

export async function extractColorsFromImage(
  model: string,
  imageBase64: string
): Promise<PaletteColor[]> {
  const response = await analyzeImage(model, EXTRACTION_PROMPT, imageBase64);

  // Extract JSON array from response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse color extraction result from model response");
  }

  const colors = JSON.parse(jsonMatch[0]) as PaletteColor[];

  // Validate each color
  return colors.filter(
    (c) =>
      typeof c.hex === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(c.hex) &&
      typeof c.role === "string" &&
      typeof c.order === "number"
  );
}
```

---

## Appendix B: Session Management (No Auth Phase 1)

```typescript
// src/lib/session.ts

const SESSION_KEY = "jedithui_session_id";

/**
 * Get or create a session ID from localStorage.
 * Used as the user identifier in Phase 1 (no auth).
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
```

---

## Appendix C: Remaining Library Configs

Implement these following the same pattern as `tailwind.ts` and `shadcn.ts` in Section 8:

### `src/lib/library-configs/antd.ts`

```typescript
// id: "antd"
// importPattern: import { Button, Table, Form, Input, Select, DatePicker, Space, Card, Tag } from "antd";
// themingInstructions: Use inline style prop or className with palette variables.
//   <Button style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }} type="primary">
//   Do NOT use ConfigProvider or theme tokens (not available in CDN preview).
// cdnUrls: ["https://unpkg.com/antd@5/dist/reset.css"]
// componentMap: { Button, Table, Form, Input, Select, DatePicker, Modal, Drawer, Tabs, Tag, Space, Card, Collapse, Steps, Upload, Pagination }
```

### `src/lib/library-configs/chakra.ts`

```typescript
// id: "chakra"
// importPattern: import { Box, Flex, Text, Heading, Button, Stack, Badge, Image } from "@chakra-ui/react";
// themingInstructions: Use style props with palette variables.
//   <Box bg="var(--color-background)" color="var(--color-text)">
//   <Button bg="var(--color-accent)" color="white">
// cdnUrls: [] (Chakra requires a provider — limited CDN preview support)
// componentMap: { Box, Flex, Text, Heading, Button, Stack, Badge, Image, Avatar, Divider, Table }
```

### `src/lib/library-configs/mantine.ts`

```typescript
// id: "mantine"
// importPattern: import { Button, TextInput, Card, Badge, Group, Stack, Title, Text } from "@mantine/core";
// themingInstructions: Use style prop with palette variables.
//   <Button style={{ background: 'var(--color-accent)' }}>
// cdnUrls: [] (Mantine requires provider — limited CDN preview support)
// componentMap: { Button, TextInput, Card, Badge, Group, Stack, Title, Text, Table, Modal, Tabs }
```

### `src/lib/library-configs/recharts.ts`

```typescript
// id: "recharts"
// importPattern: import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
// themingInstructions: Pass palette hex values directly to fill/stroke props.
//   <Bar fill="var(--color-accent)" />
//   <Line stroke="var(--color-primary)" />
//   Use array of palette colors for multi-series: [primary, accent, secondary, ...]
// cdnUrls: ["https://unpkg.com/recharts@2/umd/Recharts.js"]
// cdnGlobals: { recharts: "Recharts" }
// componentMap: { BarChart, LineChart, PieChart, AreaChart, RadarChart, ScatterChart, Tooltip, Legend }
```

---

## Appendix D: Key Implementation Notes

### Error Boundaries

Wrap all pages and the CodePreview component in React error boundaries to prevent crashes from breaking the entire app:

```typescript
// src/components/ErrorBoundary.tsx
"use client";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-700 font-semibold">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Loading States

Every page should have a loading skeleton using shadcn's Skeleton component while data fetches:

```typescript
// Pattern for all list pages:
if (isLoading) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-lg" />
      ))}
    </div>
  );
}
```

### Empty States

Every list section needs an empty state with a CTA:

```typescript
// Pattern:
if (items.length === 0) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No {itemType} yet</h3>
      <p className="text-muted-foreground mt-1">Create your first {itemType} to get started.</p>
      <Button className="mt-4" onClick={onCreate}>+ Create {itemType}</Button>
    </div>
  );
}
```

### .gitignore Additions

```
# Marp temp files
.tmp/

# Prisma
prisma/dev.db
prisma/dev.db-journal

# Preview assets (downloaded, not committed)
# Uncomment if you want to commit them for offline use:
# public/preview-assets/
```

---

*This document is the complete implementation specification for JEdithUI. Follow the build order in Section 15, implementing each file as specified. Every API contract, component interface, and code pattern is defined above — translate directly to working code.*
