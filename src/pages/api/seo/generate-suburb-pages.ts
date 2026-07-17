import type { NextApiRequest, NextApiResponse } from "next";
import { callAI } from "@/lib/aiClient";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const suburb = String(req.body?.suburb ?? "sandton");
  const draft = await callAI(`Generate SEO suburb page content for ${suburb}, South Africa.`);
  ok(res, { suburb, draft });
});
