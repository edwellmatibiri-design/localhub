import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (_req: NextApiRequest, res: NextApiResponse) => {
  ok(res, {
    clusters: [
      { keyword: "plumber near me", score: 91 },
      { keyword: "home movers cape town", score: 84 },
      { keyword: "electric fence installer", score: 88 },
    ],
  });
});
