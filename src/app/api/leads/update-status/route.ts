import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";

type UpdateLeadStatusBody = {
  id?: number | string;
  status?: "sent" | "accepted" | "ignored" | "expired";
};

async function update(request: Request) {
  let body: UpdateLeadStatusBody;
  try {
    body = (await request.json()) as UpdateLeadStatusBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const id = Number(body?.id);
  const status = String(body?.status ?? "").trim();
  if (
    !Number.isFinite(id) ||
    id <= 0 ||
    !["sent", "accepted", "ignored", "expired"].includes(status)
  ) {
    return NextResponse.json(
      { ok: false, error: "id and valid status are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: lead, error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id)
      .select("id, vendor_id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    if (
      lead?.id &&
      lead?.vendor_id &&
      (status === "ignored" || status === "expired")
    ) {
      await upsertCrmPipeline({
        vendorId: String(lead.vendor_id),
        leadId: Number(lead.id),
        stage: "lost",
        probability: 0,
        metadata: { source: "api:leads:update-status", leadStatus: status },
      });
    }

    return NextResponse.json({ ok: true, id, status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update lead",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return update(request);
}

export async function PATCH(request: Request) {
  return update(request);
}
