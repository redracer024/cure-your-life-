export interface InMemoryRateLimitOptions {
  max: number;
  windowMs: number;
}

export interface InMemoryRateLimitBucket {
  count: number;
  resetAt: number;
}

export interface InMemoryRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, InMemoryRateLimitBucket>();
  private readonly max: number;
  private readonly windowMs: number;

  constructor(options: InMemoryRateLimitOptions) {
    this.max = options.max;
    this.windowMs = options.windowMs;
  }

  consume(key: string, nowMs: number = Date.now()): InMemoryRateLimitResult {
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= nowMs) {
      this.buckets.set(key, {
        count: 1,
        resetAt: nowMs + this.windowMs,
      });
      return {
        allowed: true,
        remaining: this.max - 1,
        retryAfterSec: Math.ceil(this.windowMs / 1000),
      };
    }

    if (current.count >= this.max) {
      const retryAfterMs = Math.max(0, current.resetAt - nowMs);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    current.count += 1;
    const retryAfterMs = Math.max(0, current.resetAt - nowMs);
    return {
      allowed: true,
      remaining: this.max - current.count,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  reset(): void {
    this.buckets.clear();
  }
}
