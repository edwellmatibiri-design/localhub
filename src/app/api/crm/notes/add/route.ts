import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  vendorId?: string;
  userId?: string;
  leadId?: number | string | null;
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

  const vendorId = String(body.vendorId ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const note = String(body.note ?? "").trim();
  const leadId = Number(body.leadId);

  if (!vendorId || !note) {
    return NextResponse.json(
      { ok: false, error: "vendorId and note are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { error } = await supabase.from("crm_notes").insert({
      vendor_id: vendorId,
      user_id: userId || null,
      lead_id: Number.isFinite(leadId) && leadId > 0 ? leadId : null,
      note,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to add CRM note",
      },
      { status: 500 },
    );
  }
}
