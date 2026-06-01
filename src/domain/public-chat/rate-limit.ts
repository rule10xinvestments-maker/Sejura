const buckets = new Map<string, number[]>();

export function checkPublicRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function resetPublicRateLimitsForTests() {
  buckets.clear();
}
