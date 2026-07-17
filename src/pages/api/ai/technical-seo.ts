import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (_req: NextApiRequest, res: NextApiResponse) => {
  ok(res, {
    checks: {
      sitemap: "ok",
      robots: "ok",
      schema: "queued",
      canonicals: "ok",
    },
  });
});
