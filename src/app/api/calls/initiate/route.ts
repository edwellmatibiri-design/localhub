import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  vendorId?: string;
  staffId?: number | string | null;
  userId?: string;
  leadId?: number | string | null;
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

  const vendorId = String(body.vendorId ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const staffId = Number(body.staffId);
  const leadId = Number(body.leadId);

  if (!vendorId || !userId) {
    return NextResponse.json(
      { ok: false, error: "vendorId and userId are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: vendor, error: vendorError } = await supabase
      .from("seller_profiles")
      .select("id, calling_disabled")
      .eq("id", vendorId)
      .maybeSingle();

    if (vendorError) throw new Error(vendorError.message);
    if (!vendor) {
      return NextResponse.json(
        { ok: false, error: "Vendor not found" },
        { status: 404 },
      );
    }
    if (Boolean(vendor.calling_disabled)) {
      return NextResponse.json(
        { ok: false, error: "Vendor calling is disabled" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("call_logs")
      .insert({
        vendor_id: vendorId,
        staff_id: Number.isFinite(staffId) && staffId > 0 ? staffId : null,
        user_id: userId,
        lead_id: Number.isFinite(leadId) && leadId > 0 ? leadId : null,
        direction: "outgoing",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, callId: Number(data.id) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to initiate call",
      },
      { status: 500 },
    );
  }
}
