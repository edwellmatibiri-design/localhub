import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const email = String(req.body?.email ?? "").trim();
  if (!email) {
    fail(res, 400, "Email is required");
    return;
  }

  ok(res, { method: "email", challenge: "otp-sent", email });
});
