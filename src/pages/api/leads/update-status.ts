import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["PATCH", "POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const id = String(req.body?.id ?? "");
  const status = String(req.body?.status ?? "");
  if (!id || !status) {
    fail(res, 400, "id and status are required");
    return;
  }

  ok(res, { id, status });
});
