import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";
import { logBehaviourEvent } from "@/lib/behaviour/service";

type Body = {
  leadId?: number | string;
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
  if (!Number.isFinite(leadId) || leadId <= 0) {
    return NextResponse.json(
      { ok: false, error: "leadId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .update({ status: "accepted" })
      .eq("id", leadId)
      .eq("status", "sent")
      .select("id, user_id, vendor_id, message, created_at")
      .single();

    if (leadError) {
      return NextResponse.json(
        { ok: false, error: leadError.message },
        { status: 500 },
      );
    }

    await upsertCrmPipeline({
      vendorId: String(lead.vendor_id),
      leadId,
      stage: "contacted",
      probability: 35,
      metadata: { source: "api:leads:accept" },
    });

    const preferredDate = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        vendor_id: lead.vendor_id,
        user_id: lead.user_id,
        message: String(
          lead.message ?? "Lead accepted. Please provide a quote.",
        ),
        preferred_date: preferredDate,
        status: "new",
      })
      .select("id")
      .single();

    if (quoteError) {
      return NextResponse.json(
        { ok: false, error: quoteError.message },
        { status: 500 },
      );
    }

    await upsertCrmPipeline({
      vendorId: String(lead.vendor_id),
      leadId,
      quoteId: Number(quote.id),
      stage: "quote_sent",
      probability: 55,
      metadata: { source: "api:leads:accept:quote_created" },
    });

    await supabase.from("notifications").insert([
      {
        user_id: lead.user_id,
        vendor_id: null,
        type: "lead_accepted",
        message: `A vendor accepted your lead. Quote ${quote.id} is now available.`,
      },
      {
        user_id: null,
        vendor_id: lead.vendor_id,
        type: "lead_accepted_vendor",
        message: `You accepted lead ${lead.id}. Quote ${quote.id} created.`,
      },
    ]);

    const responseSeconds = Math.max(
      0,
      Math.round((Date.now() - Date.parse(String(lead.created_at))) / 1000),
    );
    await logBehaviourEvent({
      userId: String(lead.user_id),
      type: "lead_responded",
      metadata: { leadId, responseTimeSeconds: responseSeconds },
    });

    return NextResponse.json({ ok: true, quoteId: quote.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to accept lead",
      },
      { status: 500 },
    );
  }
}
