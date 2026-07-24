import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";

export const MISSED_CALL_TEMPLATE = "Hi, we missed your call. How can we help?";

export type MissedCallFollowupInput = {
  vendorId: string;
  userId: string;
  leadId?: number | null;
  callId?: number | null;
};

export async function runAutoFollowupForMissedCall(
  input: MissedCallFollowupInput,
) {
  const vendorId = String(input.vendorId ?? "").trim();
  const userId = String(input.userId ?? "").trim();
  const leadId = Number.isFinite(input.leadId) ? Number(input.leadId) : null;

  if (!vendorId || !userId) {
    throw new Error("vendorId and userId are required for auto-followup");
  }

  const supabase = createServiceClient();

  const whatsappMessage = MISSED_CALL_TEMPLATE;

  // Placeholder WhatsApp send log.
  await supabase.from("notifications").insert({
    vendor_id: vendorId,
    user_id: userId,
    type: "whatsapp_auto_followup",
    message: whatsappMessage,
  });

  const note = `Auto-followup sent after missed call${input.callId ? ` #${input.callId}` : ""}: ${whatsappMessage}`;
  await supabase.from("crm_notes").insert({
    vendor_id: vendorId,
    user_id: userId,
    lead_id: leadId,
    note,
  });

  if (leadId && leadId > 0) {
    await upsertCrmPipeline({
      vendorId,
      leadId,
      stage: "contacted",
      metadata: {
        source: "missed_call_auto_followup",
        callId: input.callId ?? null,
      },
    });
  }

  return { ok: true } as const;
}
