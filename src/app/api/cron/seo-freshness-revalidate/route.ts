import { NextResponse } from "next/server";
import { logEvent } from "@/lib/log";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  await logEvent("cron_seo_freshness_revalidate", { timestamp: Date.now() });
  const url = new URL("/api/seo/freshness-revalidate", request.url);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-secret": secret ?? "",
    },
    body: JSON.stringify({}),
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}
