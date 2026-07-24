import { revalidatePath } from "next/cache";
import {
  appFail,
  appOk,
  parseBody,
  requireInternalApiSecretFromRequest,
} from "@/lib/api";
import { evaluateFreshnessWindow } from "@/lib/seo/freshness";
import { revalidateFreshnessDecision } from "@/lib/seo/revalidation";
import { logEvent } from "@/lib/log";

type Body = {
  startDate?: string;
  endDate?: string;
};

function defaultDateRange() {
  const end = new Date();
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export async function POST(request: Request) {
  const denied = requireInternalApiSecretFromRequest(request);
  if (denied) return denied;

  const body = await parseBody<Body>(request);
  const fallback = defaultDateRange();
  const startDate = body?.startDate ?? fallback.startDate;
  const endDate = body?.endDate ?? fallback.endDate;

  if (!startDate || !endDate) {
    return appFail(400, "startDate and endDate are required");
  }

  const decision = await evaluateFreshnessWindow(startDate, endDate);
  revalidateFreshnessDecision(decision, revalidatePath);
  await logEvent("seo_freshness_revalidate", {
    startDate,
    endDate,
    timestamp: Date.now(),
  });

  return appOk({
    startDate,
    endDate,
    refresh: decision.refresh,
    reinforce: decision.reinforce,
    retire: decision.retire,
    revalidated: decision.revalidate,
  });
}
