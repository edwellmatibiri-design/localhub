import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { startOutreachOnboarding } from "@/lib/outreach/onboarding";

type Body = {
  businessId?: number | string;
  channel?: "email" | "whatsapp" | "sms" | "instagram" | "facebook" | "tiktok";
  message?: string;
};

export async function POST(request: Request) {
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
  const channel = String(body.channel ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!Number.isFinite(businessId) || businessId <= 0 || !channel || !message) {
    return NextResponse.json(
      { ok: false, error: "businessId, channel, and message are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { error: messageError } = await supabase
      .from("outreach_messages")
      .insert({
        business_id: businessId,
        channel,
        message,
        direction: "inbound",
        status: "replied",
      });

    if (messageError) {
      return NextResponse.json(
        { ok: false, error: messageError.message },
        { status: 500 },
      );
    }

    const { error: statusError } = await supabase
      .from("outreach_businesses")
      .update({ status: "responded", updated_at: new Date().toISOString() })
      .eq("id", businessId);

    if (statusError) {
      return NextResponse.json(
        { ok: false, error: statusError.message },
        { status: 500 },
      );
    }

    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: null,
      type: "outreach_reply",
      message: `Outreach business ${businessId} replied via ${channel}.`,
    });

    const onboarding = await startOutreachOnboarding(businessId);

    return NextResponse.json({ ok: true, onboarding });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process outreach response",
      },
      { status: 500 },
    );
  }
}
