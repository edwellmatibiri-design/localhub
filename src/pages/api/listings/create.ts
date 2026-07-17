import type { NextApiRequest, NextApiResponse } from "next";
import { listings } from "@/lib/mockData";
import { methodGuard, ok, fail } from "@/lib/api";

export default methodGuard(["POST"], async (req: NextApiRequest, res: NextApiResponse) => {
  const title = String(req.body?.title ?? "").trim();
  if (!title) {
    fail(res, 400, "Title is required");
    return;
  }

  const listing = {
    ...listings[0],
    id: `lst-${Date.now()}`,
    title,
    description: String(req.body?.description ?? "AI generated listing description."),
  };

  ok(res, listing);
});
