import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["PATCH", "POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const id = String(req.body?.id ?? "");
  if (!id) {
    fail(res, 400, "message id is required");
    return;
  }

  ok(res, { id, seen: true });
});
