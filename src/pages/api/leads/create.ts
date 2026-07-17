import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.body?.listing_id || !req.body?.message) {
    fail(res, 400, "listing_id and message are required");
    return;
  }

  ok(res, { leadId: `lead-${Date.now()}`, status: "new" });
});
