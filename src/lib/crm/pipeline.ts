import { createServiceClient } from "@/lib/db";

export const CRM_STAGES = [
  "new_lead",
  "contacted",
  "quote_sent",
  "negotiation",
  "awaiting_payment",
  "booked",
  "completed",
  "lost",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

export type CrmPipelineRow = {
  id: number;
  vendor_id: string;
  lead_id: number | null;
  quote_id: number | null;
  booking_id: number | null;
  stage: CrmStage;
  value_estimate: number;
  probability: number;
  updated_at: string;
  created_at: string;
};

export type CrmPipelineEventRow = {
  id: number;
  pipeline_id: number;
  vendor_id: string;
  from_stage: CrmStage | null;
  to_stage: CrmStage;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type UpsertCrmInput = {
  vendorId: string;
  leadId?: number | null;
  quoteId?: number | null;
  bookingId?: number | null;
  stage: CrmStage;
  valueEstimate?: number;
  probability?: number;
  metadata?: Record<string, unknown>;
};

function clampProbability(value: number | undefined) {
  if (!Number.isFinite(value)) return 0;
  if (value! < 0) return 0;
  if (value! > 100) return 100;
  return Math.round(value!);
}

function normalizeValueEstimate(value: number | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value!));
}

export async function upsertCrmPipeline(input: UpsertCrmInput) {
  const supabase = createServiceClient();

  const vendorId = String(input.vendorId ?? "").trim();
  if (!vendorId) {
    throw new Error("vendorId is required");
  }

  if (!CRM_STAGES.includes(input.stage)) {
    throw new Error("Invalid stage");
  }

  const leadId = Number.isFinite(input.leadId) ? Number(input.leadId) : null;
  const quoteId = Number.isFinite(input.quoteId) ? Number(input.quoteId) : null;
  const bookingId = Number.isFinite(input.bookingId)
    ? Number(input.bookingId)
    : null;
  const valueEstimate = normalizeValueEstimate(input.valueEstimate);
  const probability = clampProbability(input.probability);

  let existing: CrmPipelineRow | null = null;

  if (bookingId) {
    const { data } = await supabase
      .from("crm_pipeline")
      .select(
        "id, vendor_id, lead_id, quote_id, booking_id, stage, value_estimate, probability, updated_at, created_at",
      )
      .eq("vendor_id", vendorId)
      .eq("booking_id", bookingId)
      .maybeSingle();
    existing = (data as CrmPipelineRow | null) ?? null;
  } else if (quoteId) {
    const { data } = await supabase
      .from("crm_pipeline")
      .select(
        "id, vendor_id, lead_id, quote_id, booking_id, stage, value_estimate, probability, updated_at, created_at",
      )
      .eq("vendor_id", vendorId)
      .eq("quote_id", quoteId)
      .maybeSingle();
    existing = (data as CrmPipelineRow | null) ?? null;
  } else if (leadId) {
    const { data } = await supabase
      .from("crm_pipeline")
      .select(
        "id, vendor_id, lead_id, quote_id, booking_id, stage, value_estimate, probability, updated_at, created_at",
      )
      .eq("vendor_id", vendorId)
      .eq("lead_id", leadId)
      .maybeSingle();
    existing = (data as CrmPipelineRow | null) ?? null;
  }

  let saved: CrmPipelineRow;
  if (existing?.id) {
    const { data, error } = await supabase
      .from("crm_pipeline")
      .update({
        lead_id: leadId ?? existing.lead_id,
        quote_id: quoteId ?? existing.quote_id,
        booking_id: bookingId ?? existing.booking_id,
        stage: input.stage,
        value_estimate: valueEstimate || existing.value_estimate,
        probability: probability || existing.probability,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select(
        "id, vendor_id, lead_id, quote_id, booking_id, stage, value_estimate, probability, updated_at, created_at",
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    saved = data as CrmPipelineRow;
  } else {
    const { data, error } = await supabase
      .from("crm_pipeline")
      .insert({
        vendor_id: vendorId,
        lead_id: leadId,
        quote_id: quoteId,
        booking_id: bookingId,
        stage: input.stage,
        value_estimate: valueEstimate,
        probability,
      })
      .select(
        "id, vendor_id, lead_id, quote_id, booking_id, stage, value_estimate, probability, updated_at, created_at",
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    saved = data as CrmPipelineRow;
  }

  const fromStage = existing?.stage ?? null;
  if (!existing || fromStage !== input.stage) {
    await supabase.from("crm_pipeline_events").insert({
      pipeline_id: saved.id,
      vendor_id: vendorId,
      from_stage: fromStage,
      to_stage: input.stage,
      metadata: {
        leadId: saved.lead_id,
        quoteId: saved.quote_id,
        bookingId: saved.booking_id,
        ...(input.metadata ?? {}),
      },
    });
  }

  return saved;
}
