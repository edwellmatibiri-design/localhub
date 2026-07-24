import { NextResponse } from "next/server";
import { CRM_STAGES, upsertCrmPipeline } from "@/lib/crm/pipeline";

type Body = {
  vendorId?: string;
  leadId?: number | string;
  quoteId?: number | string;
  bookingId?: number | string;
  stage?: string;
  valueEstimate?: number;
  probability?: number;
};

function toOptionalNumber(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

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
  const stage = String(body.stage ?? "").trim();

  if (!vendorId || !stage) {
    return NextResponse.json(
      { ok: false, error: "vendorId and stage are required" },
      { status: 400 },
    );
  }

  if (!CRM_STAGES.includes(stage as (typeof CRM_STAGES)[number])) {
    return NextResponse.json(
      { ok: false, error: "Invalid stage" },
      { status: 400 },
    );
  }

  try {
    await upsertCrmPipeline({
      vendorId,
      leadId: toOptionalNumber(body.leadId),
      quoteId: toOptionalNumber(body.quoteId),
      bookingId: toOptionalNumber(body.bookingId),
      stage: stage as (typeof CRM_STAGES)[number],
      valueEstimate: Number(body.valueEstimate ?? 0),
      probability: Number(body.probability ?? 0),
      metadata: { source: "api:crm:update" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update CRM pipeline",
      },
      { status: 500 },
    );
  }
}
