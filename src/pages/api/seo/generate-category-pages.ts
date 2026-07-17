import type { NextApiRequest, NextApiResponse } from "next";
import { callAI } from "@/lib/aiClient";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const category = String(req.body?.category ?? "plumbing");
  const draft = await callAI(`Generate SEO category page content for ${category} in South Africa.`);
  ok(res, { category, draft });
});
