import type { NextApiRequest, NextApiResponse } from "next";
import { methodGuard, ok } from "@/lib/api";

export default methodGuard(["POST"], async (_req: NextApiRequest, res: NextApiResponse) => {
  ok(res, {
    created: ["midrand", "umhlanga", "morningside"],
  });
});
