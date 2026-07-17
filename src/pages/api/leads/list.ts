import type { NextApiRequest, NextApiResponse } from "next";
import { leads } from "@/lib/mockData";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["GET"], async (_req: NextApiRequest, res: NextApiResponse) => {
  ok(res, leads);
});
