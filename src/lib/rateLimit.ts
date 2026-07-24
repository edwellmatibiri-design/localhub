const WINDOW = 60_000;
const LIMIT = 5;

const store = new Map<string, number[]>();

export async function rateLimit(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for") || "unknown";
  const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
  const now = Date.now();

  const timestamps = store.get(ip) || [];
  const filtered = timestamps.filter((t) => now - t < WINDOW);

  if (filtered.length >= LIMIT) {
    return { ok: false };
  }

  filtered.push(now);
  store.set(ip, filtered);

  return { ok: true };
}
