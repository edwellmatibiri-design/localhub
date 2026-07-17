import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (_req: NextApiRequest, res: NextApiResponse) => {
  ok(res, {
    combosGenerated: 36,
    pagesQueued: 36,
    internalLinksQueued: 288,
  });
});
