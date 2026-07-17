import type { NextApiRequest, NextApiResponse } from "next";
import { callAI } from "@/lib/aiClient";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const prompt = String(req.body?.prompt ?? "Generate service listing content.");
  ok(res, await callAI(prompt));
});
