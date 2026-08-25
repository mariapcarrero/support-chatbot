import { RATE_LIMIT } from "@/lib/ai/config";

/**
 * Fixed-window rate limiter, in process memory.
 *
 * Known limitation, stated rather than hidden: this is per serverless instance. Vercel may
 * run several concurrently, so the effective global limit is the configured limit times the
 * number of warm instances, and counters reset on cold start. That is acceptable here
 * because the purpose is to blunt a single abusive client and cap runaway spend from one
 * session, not to enforce a precise quota.
 *
 * The correct fix at real traffic is a shared store (Upstash Redis, or Vercel's firewall
 * rate limiting at the edge). Swapping this out means replacing one function — that is why
 * the interface takes a key and returns a decision, with no storage details leaking out.
 */
interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Bound on tracked keys, so a flood of distinct sessions cannot grow the map unboundedly. */
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitDecision {
  allowed: boolean;
  /** Seconds until the window resets. Sent as `Retry-After`. */
  retryAfter: number;
  remaining: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitDecision {
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    if (windows.size >= MAX_TRACKED_KEYS) evictExpired(now);
    windows.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true, retryAfter: 0, remaining: RATE_LIMIT.maxRequests - 1 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

  if (existing.count > RATE_LIMIT.maxRequests) {
    return { allowed: false, retryAfter, remaining: 0 };
  }

  return {
    allowed: true,
    retryAfter: 0,
    remaining: RATE_LIMIT.maxRequests - existing.count,
  };
}

function evictExpired(now: number): void {
  for (const [key, window] of windows) {
    if (now >= window.resetAt) windows.delete(key);
  }
  // Still full of live windows — drop the oldest insertion to stay bounded. Map preserves
  // insertion order, so the first key is the least recently created.
  if (windows.size >= MAX_TRACKED_KEYS) {
    const oldest = windows.keys().next();
    if (!oldest.done) windows.delete(oldest.value);
  }
}

/** Test seam. */
export function resetRateLimits(): void {
  windows.clear();
}
