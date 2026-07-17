import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["GET"], async (_req: NextApiRequest, res: NextApiResponse) => {
  ok(res, [
    { id: "msg-1", content: "Hi, is this still available?", seen: true },
    { id: "msg-2", content: "Yes, still available.", seen: false },
  ]);
});
