import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import {
  runOutreachAutomation,
  type OutreachBusinessRecord,
} from "@/lib/outreach/automation";
import { logEvent } from "@/lib/log";

type Body = {
  businessId?: number | string;
};

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const businessId = Number(body.businessId);
  if (!Number.isFinite(businessId) || businessId <= 0) {
    return NextResponse.json(
      { ok: false, error: "businessId is required" },
      { status: 400 },
    );
  }

  try {
    await logEvent("outreach_send", { businessId, timestamp: Date.now() });

    const supabase = createServiceClient();
    const { data: business, error } = await supabase
      .from("outreach_businesses")
      .select(
        "id, business_name, category, location, email, phone, whatsapp_number, instagram_handle, facebook_page, tiktok_handle, website, status",
      )
      .eq("id", businessId)
      .maybeSingle();

    if (error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    if (!business)
      return NextResponse.json(
        { ok: false, error: "Business not found" },
        { status: 404 },
      );

    const result = await runOutreachAutomation(
      business as OutreachBusinessRecord,
    );
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to run outreach",
      },
      { status: 500 },
    );
  }
}
