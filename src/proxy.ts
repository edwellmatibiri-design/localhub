import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RateEntry = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateEntry>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

function clientKey(request: NextRequest): string {
  const ip = clientIp(request);
  return `${ip}:${request.nextUrl.pathname}`;
}

function isRateLimited(request: NextRequest): boolean {
  const key = clientKey(request);
  const now = Date.now();
  const current = rateStore.get(key);

  if (!current || now > current.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  rateStore.set(key, current);
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (isRateLimited(request)) {
      console.warn("[proxy] rate-limit-block", {
        ip: clientIp(request),
        path: request.nextUrl.pathname,
      });
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
