type Bucket = {
  count: number;
  resetAtMs: number;
};

export type LimitResult = {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
};

const buckets = new Map<string, Bucket>();

export function applyRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
  nowMs = Date.now(),
): LimitResult {
  const existing = buckets.get(key);
  const isExpired = !existing || existing.resetAtMs <= nowMs;

  const bucket: Bucket = isExpired
    ? { count: 0, resetAtMs: nowMs + windowMs }
    : { count: existing.count, resetAtMs: existing.resetAtMs };

  if (bucket.count >= maxRequests) {
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, resetAtMs: bucket.resetAtMs };
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - bucket.count),
    resetAtMs: bucket.resetAtMs,
  };
}
