import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const phone = String(req.body?.phone ?? "").trim();
  if (!phone) {
    fail(res, 400, "Phone is required");
    return;
  }

  ok(res, { method: "phone", challenge: "otp-sent", phone });
});
