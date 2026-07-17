import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["DELETE", "POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const id = String(req.body?.id ?? "");
  if (!id) {
    fail(res, 400, "Listing id is required");
    return;
  }

  ok(res, { id, deleted: true });
});
