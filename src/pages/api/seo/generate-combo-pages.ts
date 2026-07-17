import type { NextApiRequest, NextApiResponse } from "next";
import { callAI } from "@/lib/aiClient";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const category = String(req.body?.category ?? "plumbing");
  const suburb = String(req.body?.suburb ?? "sandton");
  const draft = await callAI(`Generate an SEO page for ${category} in ${suburb} with internal links.`);
  ok(res, { category, suburb, draft });
});
