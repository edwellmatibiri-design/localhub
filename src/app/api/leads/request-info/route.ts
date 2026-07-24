import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  leadId?: number | string;
  vendorId?: string;
  note?: string;
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

  const leadId = Number(body.leadId);
  const vendorId = String(body.vendorId ?? "").trim();
  const note = String(body.note ?? "").trim();

  if (!Number.isFinite(leadId) || leadId <= 0 || !vendorId || !note) {
    return NextResponse.json(
      { ok: false, error: "leadId, vendorId, and note are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, user_id, vendor_id")
      .eq("id", leadId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (leadError)
      return NextResponse.json(
        { ok: false, error: leadError.message },
        { status: 500 },
      );
    if (!lead)
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 },
      );

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: String(lead.user_id),
        vendor_id: null,
        type: "more_info_requested",
        message: `Vendor requested more info on lead ${leadId}: ${note}`,
      });

    if (notificationError) {
      return NextResponse.json(
        { ok: false, error: notificationError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to request info",
      },
      { status: 500 },
    );
  }
}
