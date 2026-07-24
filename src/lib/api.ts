import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void> | void;

export function methodGuard(methods: string[], handler: Handler): Handler {
  return async (req, res) => {
    if (!req.method || !methods.includes(req.method)) {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    await handler(req, res);
  };
}

export function ok(res: NextApiResponse, data: unknown = {}) {
  res.status(200).json({ ok: true, data, timestamp: new Date().toISOString() });
}

export function fail(res: NextApiResponse, status: number, error: string) {
  res
    .status(status)
    .json({ ok: false, error, timestamp: new Date().toISOString() });
}

export function requireInternalApiSecret(
  req: NextApiRequest,
  res: NextApiResponse,
): boolean {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    fail(res, 500, "INTERNAL_API_SECRET is not configured");
    return false;
  }

  const headerSecret =
    req.headers["x-internal-secret"] ?? req.headers["x-internal-api-secret"];
  const provided = Array.isArray(headerSecret) ? headerSecret[0] : headerSecret;

  if (!provided || provided !== expected) {
    fail(res, 401, "Unauthorized internal API request");
    return false;
  }

  return true;
}

export function appOk(data: unknown = {}, status = 200) {
  return NextResponse.json(
    { ok: true, data, timestamp: new Date().toISOString() },
    { status },
  );
}

export function appFail(status: number, error: string) {
  return NextResponse.json(
    { ok: false, error, timestamp: new Date().toISOString() },
    { status },
  );
}

export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function requireInternalApiSecretFromRequest(
  request: Request,
): NextResponse | null {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    return appFail(500, "INTERNAL_API_SECRET is not configured");
  }

  const provided =
    request.headers.get("x-internal-secret") ??
    request.headers.get("x-internal-api-secret");
  if (!provided || provided !== expected) {
    return appFail(401, "Unauthorized internal API request");
  }

  return null;
}

export function requireAuthenticatedUser(
  request: Request,
): { userId: string } | NextResponse {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return appFail(401, "Authentication required");
  }

  return { userId };
}

export function requireAdmin(request: Request): NextResponse | null {
  const role = (request.headers.get("x-user-role") ?? "").toLowerCase();
  if (role !== "admin") {
    return appFail(403, "Admin access required");
  }

  return null;
}
