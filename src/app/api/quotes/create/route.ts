import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";

type QuoteBody = {
  vendorId?: string;
  userId?: string;
  leadId?: number | string;
  message?: string;
  preferredDate?: string;
  valueEstimate?: number;
  probability?: number;
};

export async function POST(request: Request) {
  let body: QuoteBody;
  try {
    body = (await request.json()) as QuoteBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const vendorId = String(body.vendorId ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const leadId = Number(body.leadId);
  const message = String(body.message ?? "").trim();
  const preferredDate = String(body.preferredDate ?? "").trim();

  if (!vendorId || !userId || !message || !preferredDate) {
    return NextResponse.json(
      {
        ok: false,
        error: "vendorId, userId, message, preferredDate are required",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        vendor_id: vendorId,
        user_id: userId,
        message,
        preferred_date: preferredDate,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    await upsertCrmPipeline({
      vendorId,
      leadId: Number.isFinite(leadId) && leadId > 0 ? leadId : null,
      quoteId: Number(data.id),
      stage: "quote_sent",
      valueEstimate: Number(body.valueEstimate ?? 0),
      probability: Number(body.probability ?? 55),
      metadata: { source: "api:quotes:create" },
    });

    return NextResponse.json({ ok: true, quoteId: data.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create quote",
      },
      { status: 500 },
    );
  }
}
