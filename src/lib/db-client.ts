/**
 * Client-side IndexedDB database using Dexie.js
 * All user data (palettes, chats, messages, code versions) lives in the browser.
 * No server-side storage — Ollama API routes are stateless.
 */
import Dexie, { type EntityTable } from "dexie";

// ─── Table Types ────────────────────────────────────

export interface DBPalette {
  id: string;
  name: string;
  source: string; // "IMAGE" | "CSS" | "MANUAL"
  colors: DBColor[];
  createdAt: string;
  updatedAt: string;
}

export interface DBColor {
  hex: string;
  role: string;
  order: number;
}

export interface DBChat {
  id: string;
  name: string;
  type: string; // "CODE" | "PRESENTATION"
  framework?: string;
  libraries: string[];
  slideTheme?: string;
  modelName: string;
  paletteId: string;
  linkedChatId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBMessage {
  id: string;
  role: string; // "USER" | "ASSISTANT"
  content: string;
  imageBase64?: string;
  chatId: string;
  createdAt: string;
}

export interface DBCodeVersion {
  id: string;
  code: string;
  language: string;
  version: number;
  modelName: string;
  messageId: string;
  chatId: string; // denormalized for easy queries
  createdAt: string;
}

export interface DBSlideVersion {
  id: string;
  markdown: string;
  slideCount: number;
  version: number;
  modelName: string;
  messageId: string;
  chatId: string; // denormalized for easy queries
  createdAt: string;
}

export interface DBSwaggerSpec {
  id: string;
  name: string;
  version?: string;
  specJson: string;
  endpoints: DBSwaggerEndpoint[];
  createdAt: string;
  updatedAt: string;
}

export interface DBSwaggerEndpoint {
  method: string;
  path: string;
  summary?: string;
  suggestedUI?: string;
  requestSchema?: string;
  responseSchema?: string;
}

// ─── Database Class ─────────────────────────────────

class JEdithDB extends Dexie {
  palettes!: EntityTable<DBPalette, "id">;
  chats!: EntityTable<DBChat, "id">;
  messages!: EntityTable<DBMessage, "id">;
  codeVersions!: EntityTable<DBCodeVersion, "id">;
  slideVersions!: EntityTable<DBSlideVersion, "id">;
  swaggerSpecs!: EntityTable<DBSwaggerSpec, "id">;

  constructor() {
    super("jedith-ui");

    this.version(1).stores({
      palettes: "id, name, source, createdAt, updatedAt",
      chats: "id, type, paletteId, createdAt, updatedAt",
      messages: "id, chatId, role, createdAt",
      codeVersions: "id, messageId, chatId, version",
      slideVersions: "id, messageId, chatId, version",
      swaggerSpecs: "id, name, createdAt",
    });
  }
}

// Singleton
export const db = new JEdithDB();

// ─── ID Generator ───────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}
