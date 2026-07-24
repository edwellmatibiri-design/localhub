import { createServiceClient } from "@/lib/db";

const EXPIRY_MS = 2 * 60 * 60 * 1000;

export async function expireStaleLeads() {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - EXPIRY_MS).toISOString();

  const { data: staleLeads, error: staleError } = await supabase
    .from("leads")
    .select("id, vendor_id, user_id, created_at")
    .eq("status", "sent")
    .lt("created_at", cutoff);

  if (staleError) {
    throw new Error(staleError.message);
  }

  if (!staleLeads || staleLeads.length === 0) {
    return { expiredCount: 0, rerouteQueued: 0 };
  }

  const leadIds = staleLeads
    .map((lead) => Number(lead.id))
    .filter((id) => Number.isFinite(id));
  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: "expired" })
    .in("id", leadIds);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Placeholder hook for rerouting pipeline. Future step can enqueue reroute jobs here.
  return {
    expiredCount: leadIds.length,
    rerouteQueued: 0,
  };
}
