import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { dailyPromptLimit, dailyQuotaErrorCode } from "@/lib/rate-limit-constants";

const DAILY_PROMPT_LIMIT = dailyPromptLimit;
const QUOTA_ERROR_CODE = dailyQuotaErrorCode;

type QuotaStatus = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  ip: string;
  unlimited: boolean;
};

let redisClient: Redis | null | undefined;

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function sanitizeKeyPart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9:._-]/g, "_").slice(0, 120);
}

function parseHostname(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).hostname.toLowerCase();
    }
  } catch {
    return null;
  }

  const first = trimmed.split(",")[0]?.trim() ?? trimmed;
  const withoutPort = first.replace(/^\[|\]$/g, "").split(":")[0]?.trim();
  return withoutPort ? withoutPort.toLowerCase() : null;
}

function isLocalHostname(hostname: string | null | undefined): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getRequestHostname(req: NextRequest): string | null {
  const forwardedHost = parseHostname(req.headers.get("x-forwarded-host"));
  if (forwardedHost) return forwardedHost;

  const host = parseHostname(req.headers.get("host"));
  if (host) return host;

  const origin = parseHostname(req.headers.get("origin"));
  if (origin) return origin;

  return parseHostname(req.headers.get("referer"));
}

function isLocalOllamaConfigured(): boolean {
  const baseUrl = parseHostname(process.env.OLLAMA_BASE_URL);
  return isLocalHostname(baseUrl);
}

export function shouldDisableRateLimit(req: NextRequest): boolean {
  return isLocalOllamaConfigured() && isLocalHostname(getRequestHostname(req));
}

export function buildUnlimitedQuota(ip: string): QuotaStatus {
  return {
    allowed: true,
    limit: DAILY_PROMPT_LIMIT,
    remaining: DAILY_PROMPT_LIMIT,
    resetAt: "",
    ip,
    unlimited: true,
  };
}

function secondsUntilNextUtcMidnight(now = new Date()): number {
  const nextMidnightUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(1, Math.floor((nextMidnightUtc - now.getTime()) / 1000));
}

function nextUtcMidnightIso(now = new Date()): string {
  const nextMidnightUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return new Date(nextMidnightUtc).toISOString();
}

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const vercelForwardedIp = req.headers.get("x-vercel-forwarded-for")?.trim();
  const cloudflareIp = req.headers.get("cf-connecting-ip")?.trim();
  const requestIp = (req as NextRequest & { ip?: string | null }).ip?.trim();

  const detectedIp =
    forwardedIp || realIp || vercelForwardedIp || cloudflareIp || requestIp;

  if (detectedIp) {
    return sanitizeKeyPart(detectedIp);
  }

  const userAgent = req.headers.get("user-agent") ?? "unknown";
  return `unknown:${sanitizeKeyPart(userAgent)}`;
}

export async function consumeDailyPromptCredit(ip: string): Promise<QuotaStatus> {
  const now = new Date();
  const resetAt = nextUtcMidnightIso(now);

  const redis = getRedisClient();
  if (!redis) {
    return {
      allowed: true,
      limit: DAILY_PROMPT_LIMIT,
      remaining: DAILY_PROMPT_LIMIT,
      resetAt,
      ip,
      unlimited: false,
    };
  }

  const dateBucket = now.toISOString().slice(0, 10);
  const redisKey = `rate-limit:prompts:${dateBucket}:${sanitizeKeyPart(ip)}`;

  const remainingRaw = await redis.eval(
    `
local key = KEYS[1]
local dailyLimit = tonumber(ARGV[1])
local ttlSeconds = tonumber(ARGV[2])
local current = redis.call("GET", key)

if not current then
  redis.call("SET", key, dailyLimit, "EX", ttlSeconds)
  current = dailyLimit
else
  current = tonumber(current)
end

if current <= 0 then
  return -1
end

local remaining = redis.call("DECR", key)
return remaining
`,
    [redisKey],
    [String(DAILY_PROMPT_LIMIT), String(secondsUntilNextUtcMidnight(now))]
  );

  const remaining = Number(remainingRaw);
  return {
    allowed: remaining >= 0,
    limit: DAILY_PROMPT_LIMIT,
    remaining: Math.max(0, remaining),
    resetAt,
    ip,
    unlimited: false,
  };
}

export async function peekDailyPromptCredit(ip: string): Promise<QuotaStatus> {
  const now = new Date();
  const resetAt = nextUtcMidnightIso(now);

  const redis = getRedisClient();
  if (!redis) {
    return {
      allowed: true,
      limit: DAILY_PROMPT_LIMIT,
      remaining: DAILY_PROMPT_LIMIT,
      resetAt,
      ip,
      unlimited: false,
    };
  }

  const dateBucket = now.toISOString().slice(0, 10);
  const redisKey = `rate-limit:prompts:${dateBucket}:${sanitizeKeyPart(ip)}`;

  const current = await redis.get<number>(redisKey);
  const remaining = current === null ? DAILY_PROMPT_LIMIT : Math.max(0, current);

  return {
    allowed: remaining > 0,
    limit: DAILY_PROMPT_LIMIT,
    remaining,
    resetAt,
    ip,
    unlimited: false,
  };
}

export function applyQuotaHeaders(response: Response, quota: QuotaStatus): void {
  if (quota.unlimited) {
    response.headers.set("X-RateLimit-Unlimited", "1");
    response.headers.set("X-RateLimit-Limit", "infinity");
    response.headers.set("X-RateLimit-Remaining", "infinity");
    response.headers.set("X-RateLimit-Reset", "never");
    return;
  }

  response.headers.set("X-RateLimit-Unlimited", "0");
  response.headers.set("X-RateLimit-Limit", String(quota.limit));
  response.headers.set("X-RateLimit-Remaining", String(quota.remaining));
  response.headers.set("X-RateLimit-Reset", quota.resetAt);
}

export function buildQuotaExceededPayload(quota: QuotaStatus) {
  return {
    error: "You have reached your daily credit quota.",
    code: QUOTA_ERROR_CODE,
    limit: quota.limit,
    remaining: quota.remaining,
    resetAt: quota.resetAt,
  };
}
