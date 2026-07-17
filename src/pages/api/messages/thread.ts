import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["GET"], async (req: NextApiRequest, res: NextApiResponse) => {
  ok(res, {
    conversationId: String(req.query.conversationId ?? "default-thread"),
    messages: [
      { id: "msg-1", content: "Hello" },
      { id: "msg-2", content: "How can I help?" },
    ],
  });
});
