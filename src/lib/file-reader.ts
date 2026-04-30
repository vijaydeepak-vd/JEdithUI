/**
 * Client-side file reading utility.
 * Reads files, categorizes them, and builds context strings for AI prompts.
 */
import type { AttachedFile, FileCategory } from "@/types";

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "json", "csv", "xml", "html", "htm", "yaml", "yml",
  "log", "ini", "toml", "env", "sql", "graphql", "gql",
  "ts", "tsx", "js", "jsx", "py", "java", "go", "rs", "rb", "php",
  "css", "scss", "less", "svg",
]);

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp"]);

const DOCUMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "pptx"]);

/** Map extensions to MIME accept strings for the file picker */
export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
  "text/*": [".txt", ".md", ".csv", ".log", ".xml", ".html", ".htm", ".yaml", ".yml", ".ini", ".toml", ".env", ".sql"],
  "application/json": [".json"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "text/x-typescript": [".ts", ".tsx"],
  "text/javascript": [".js", ".jsx"],
};

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function categorizeFile(file: File): FileCategory {
  const ext = getExtension(file.name);
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (TEXT_EXTENSIONS.has(ext)) return "text";
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document";
  // Fallback: check MIME type
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("text/") || file.type === "application/json") return "text";
  return "document";
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

/** Read a File into an AttachedFile, extracting text or base64 as appropriate. */
export async function readFile(file: File): Promise<AttachedFile> {
  const id = crypto.randomUUID();
  const category = categorizeFile(file);

  if (category === "text") {
    const textContent = await readAsText(file);
    return { id, name: file.name, category, size: file.size, mimeType: file.type, textContent };
  }

  const base64 = await readAsBase64(file);
  return { id, name: file.name, category, size: file.size, mimeType: file.type, base64 };
}

/** Build a context block from attached files to prepend to the AI prompt. */
export function buildFileContext(files: AttachedFile[]): string {
  const textFiles = files.filter((f) => f.textContent);
  if (textFiles.length === 0) return "";

  const blocks = textFiles.map(
    (f) => `--- File: ${f.name} ---\n${f.textContent!.slice(0, 50000)}`
  );
  return `The user attached the following file(s) as context:\n\n${blocks.join("\n\n")}\n\n---\n\n`;
}

/** Get the first image's base64 from attachments (for vision model). */
export function getFirstImageBase64(files: AttachedFile[]): string | undefined {
  return files.find((f) => f.category === "image")?.base64;
}

/** Format file size for display. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Get icon label for file category display. */
export function getFileIcon(file: AttachedFile): string {
  const ext = getExtension(file.name);
  const icons: Record<string, string> = {
    pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
    json: "{ }", csv: "📊", md: "📑", txt: "📃", sql: "🗃️",
    ts: "TS", tsx: "⚛️", js: "JS", jsx: "⚛️", py: "🐍",
    html: "🌐", css: "🎨", yaml: "⚙️", yml: "⚙️", xml: "📋",
  };
  if (file.category === "image") return "🖼️";
  return icons[ext] || "📎";
}
