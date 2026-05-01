/**
 * Temporary in-memory store for file attachments during page navigation.
 *
 * When a user attaches files on the "new chat" page and submits,
 * the attachments can't travel via URL params (too large).
 * This module holds them in memory during the client-side redirect
 * so the chat thread page can pick them up.
 *
 * Usage:
 *   setPendingAttachments(files)  → call before router.push()
 *   consumePendingAttachments()   → call once on the destination page
 */
import type { AttachedFile } from "@/types";

let pending: AttachedFile[] | null = null;

/** Store attachments before navigating away. */
export function setPendingAttachments(files: AttachedFile[]) {
  pending = files;
}

/** Retrieve and clear pending attachments (one-time read). */
export function consumePendingAttachments(): AttachedFile[] | null {
  const files = pending;
  pending = null;
  return files;
}
