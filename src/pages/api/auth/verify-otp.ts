import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const otp = String(req.body?.otp ?? "");
  if (otp.length < 4) {
    fail(res, 400, "Invalid OTP");
    return;
  }

  ok(res, { verified: true, token: "localhub-session-token" });
});
