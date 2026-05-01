import { dailyPromptLimit } from "@/lib/rate-limit-constants";

export const promptQuotaStorageKey = "jedith:prompt-quota";
export const promptQuotaUpdatedEvent = "jedith:prompt-quota-updated";

export type PromptQuotaSnapshot = {
  unlimited?: boolean;
  limit: number;
  remaining: number;
  resetAt?: string;
  updatedAt: string;
};

function isClient(): boolean {
  return typeof window !== "undefined";
}

function normalizeSnapshot(snapshot: PromptQuotaSnapshot): PromptQuotaSnapshot {
  if (snapshot.unlimited) {
    return {
      unlimited: true,
      limit: dailyPromptLimit,
      remaining: dailyPromptLimit,
      resetAt: snapshot.resetAt,
      updatedAt: snapshot.updatedAt,
    };
  }

  const limit = Number.isFinite(snapshot.limit)
    ? Math.max(1, Math.floor(snapshot.limit))
    : dailyPromptLimit;
  const remaining = Number.isFinite(snapshot.remaining)
    ? Math.max(0, Math.min(Math.floor(snapshot.remaining), limit))
    : limit;

  return {
    limit,
    remaining,
    resetAt: snapshot.resetAt,
    updatedAt: snapshot.updatedAt,
  };
}

export function readPromptQuotaSnapshot(): PromptQuotaSnapshot | null {
  if (!isClient()) return null;

  const raw = window.localStorage.getItem(promptQuotaStorageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PromptQuotaSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    return normalizeSnapshot(parsed);
  } catch {
    return null;
  }
}

export function writePromptQuotaSnapshot(snapshot: PromptQuotaSnapshot): void {
  if (!isClient()) return;

  const normalized = normalizeSnapshot(snapshot);
  window.localStorage.setItem(promptQuotaStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(
    new CustomEvent(promptQuotaUpdatedEvent, { detail: normalized })
  );
}

export function updatePromptQuotaFromHeaders(headers: Headers): void {
  const unlimitedHeader = headers.get("X-RateLimit-Unlimited");
  if (unlimitedHeader === "1") {
    writePromptQuotaSnapshot({
      unlimited: true,
      limit: dailyPromptLimit,
      remaining: dailyPromptLimit,
      resetAt: undefined,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const limitHeader = headers.get("X-RateLimit-Limit");
  const remainingHeader = headers.get("X-RateLimit-Remaining");

  if (!limitHeader || !remainingHeader) return;

  const limit = Number(limitHeader);
  const remaining = Number(remainingHeader);
  if (!Number.isFinite(limit) || !Number.isFinite(remaining)) return;

  writePromptQuotaSnapshot({
    limit,
    remaining,
    resetAt: headers.get("X-RateLimit-Reset") ?? undefined,
    updatedAt: new Date().toISOString(),
  });
}

export function updatePromptQuotaFromPayload(payload: {
  unlimited?: boolean;
  limit?: number;
  remaining?: number;
  resetAt?: string;
}): void {
  if (payload.unlimited) {
    writePromptQuotaSnapshot({
      unlimited: true,
      limit: dailyPromptLimit,
      remaining: dailyPromptLimit,
      resetAt: undefined,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  if (typeof payload.limit !== "number" || typeof payload.remaining !== "number") {
    return;
  }

  writePromptQuotaSnapshot({
    limit: payload.limit,
    remaining: payload.remaining,
    resetAt: payload.resetAt,
    updatedAt: new Date().toISOString(),
  });
}
