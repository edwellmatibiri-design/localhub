import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  userId?: string;
  vendorId?: string;
  staffId?: number | string | null;
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

  const userId = String(body.userId ?? "").trim();
  const vendorId = String(body.vendorId ?? "").trim();
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

    const { data, error } = await supabase
      .from("call_logs")
      .insert({
        vendor_id: vendorId,
        staff_id: Number.isFinite(staffId) && staffId > 0 ? staffId : null,
        user_id: userId,
        lead_id: Number.isFinite(leadId) && leadId > 0 ? leadId : null,
        direction: "incoming",
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
          error instanceof Error ? error.message : "Failed to receive call",
      },
      { status: 500 },
    );
  }
}
