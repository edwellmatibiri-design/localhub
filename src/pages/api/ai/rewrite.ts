import type { NextApiRequest, NextApiResponse } from "next";
import { callAI } from "@/lib/aiClient";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const content = String(req.body?.content ?? "");
  ok(res, await callAI(`Rewrite this listing for better conversion and SEO: ${content}`));
});
