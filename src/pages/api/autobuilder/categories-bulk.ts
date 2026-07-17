import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const source = String(req.body?.source ?? "keyword-gap");
  ok(res, {
    source,
    created: ["roof-waterproofing", "generator-repair", "office-disinfection"],
  });
});
