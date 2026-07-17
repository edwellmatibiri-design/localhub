import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.body?.sender_id || !req.body?.receiver_id || !req.body?.content) {
    fail(res, 400, "sender_id, receiver_id and content are required");
    return;
  }

  ok(res, { messageId: `msg-${Date.now()}`, seen: false });
});
