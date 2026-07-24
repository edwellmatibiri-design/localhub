import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";

type RejectBody = {
  quoteId?: string;
};

export async function POST(request: Request) {
  let body: RejectBody;
  try {
    body = (await request.json()) as RejectBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const quoteId = String(body.quoteId ?? "").trim();
  if (!quoteId) {
    return NextResponse.json(
      { ok: false, error: "quoteId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: quote, error } = await supabase
      .from("quotes")
      .update({ status: "rejected" })
      .eq("id", quoteId)
      .select("id, vendor_id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    if (quote?.id && quote?.vendor_id) {
      await upsertCrmPipeline({
        vendorId: String(quote.vendor_id),
        quoteId: Number(quote.id),
        stage: "lost",
        probability: 0,
        metadata: { source: "api:quotes:reject" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to reject quote",
      },
      { status: 500 },
    );
  }
}
