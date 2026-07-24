import { NextResponse } from "next/server";
import { runMelissaHourly } from "@/lib/melissa/engine";
import { logEvent } from "@/lib/log";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  await logEvent("cron_melissa_hourly", { timestamp: Date.now() });
  const data = await runMelissaHourly("eddie-admin");
  return NextResponse.json({ ok: true, data });
}
