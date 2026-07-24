import { sb } from "@/lib/supabase/serverClient";

export const melissaSafetyDefaults: Record<string, boolean> = {
  close_ticket: true,
  reassign_ticket: true,
  payout_recheck: true,
  vendor_reminder: true,
  compliance_reminder: true,
  flag_vendor: true,
  suspend_vendor: false,
  suspend_user: false,
  pause_payouts: false,
  modify_ranking_algorithm: false,
  modify_booking_rules: false,
  modify_legal_documents: false,
};

export async function isActionAllowed(actionType: string): Promise<boolean> {
  const fallback = melissaSafetyDefaults[actionType] ?? false;

  const { data, error } = await sb()
    .from("melissa_safety_rules")
    .select("enabled")
    .eq("action_type", actionType)
    .maybeSingle();

  if (error || !data) return fallback;
  return Boolean(data.enabled);
}

export async function getMelissaSafetyRules() {
  const { data, error } = await sb()
    .from("melissa_safety_rules")
    .select("action_type, enabled");
  if (error) {
    return Object.entries(melissaSafetyDefaults).map(
      ([actionType, enabled]) => ({ actionType, enabled }),
    );
  }

  const liveRules = new Map(
    (data ?? []).map((row) => [String(row.action_type), Boolean(row.enabled)]),
  );
  return Object.keys(melissaSafetyDefaults).map((actionType) => ({
    actionType,
    enabled: liveRules.has(actionType)
      ? Boolean(liveRules.get(actionType))
      : melissaSafetyDefaults[actionType],
  }));
}

export async function setMelissaSafetyRule(
  actionType: string,
  enabled: boolean,
  updatedBy = "eddie-admin",
) {
  const { error } = await sb().from("melissa_safety_rules").upsert(
    {
      action_type: actionType,
      enabled,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "action_type" },
  );

  return { ok: !error, error: error?.message ?? null };
}
