import { NextRequest, NextResponse } from "next/server";
import {
  buildUnlimitedQuota,
  getClientIp,
  peekDailyPromptCredit,
  shouldDisableRateLimit,
} from "@/lib/rate-limit";

/**
 * GET /api/quota
 *
 * Returns the current daily prompt quota for the caller
 * without consuming a credit. Used on app load to hydrate
 * the sidebar credit display.
 */
export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);

  const quota = shouldDisableRateLimit(req)
    ? buildUnlimitedQuota(clientIp)
    : await peekDailyPromptCredit(clientIp);

  return NextResponse.json({
    unlimited: quota.unlimited,
    limit: quota.limit,
    remaining: quota.remaining,
    resetAt: quota.resetAt,
  });
}
