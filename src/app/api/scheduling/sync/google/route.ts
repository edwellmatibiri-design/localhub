import { NextResponse } from "next/server";
import { logEvent } from "@/lib/log";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  await logEvent("scheduling_sync_google", { timestamp: Date.now() });
  return NextResponse.json({ ok: true });
}
