import { NextResponse } from "next/server";
import { generateWeeklyOpsReport } from "@/lib/melissa/weeklyReport";
import { logEvent } from "@/lib/log";

export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  await logEvent("melissa_weekly_run", { timestamp: Date.now() });
  const report = await generateWeeklyOpsReport();
  return NextResponse.json({ ok: true, report });
}
