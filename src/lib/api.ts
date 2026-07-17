import type { NextApiRequest, NextApiResponse } from "next";

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

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
  res.status(status).json({ ok: false, error, timestamp: new Date().toISOString() });
}
