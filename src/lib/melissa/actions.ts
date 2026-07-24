import { sb } from "@/lib/supabase/serverClient";
import { logMelissaAction } from "./memory";
import { isActionAllowed } from "./safety";

export async function closeTicket(ticketId: string) {
  if (!(await isActionAllowed("close_ticket"))) {
    await logMelissaAction("action_blocked", {
      actionType: "close_ticket",
      ticketId,
    });
    return { ok: false, error: "Action not allowed by safety rules" };
  }

  const { error } = await sb()
    .from("support_tickets")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", ticketId);

  await logMelissaAction("close_ticket", { ticketId });
  return { ok: !error, error: error?.message ?? null };
}

export async function reassignTicket(ticketId: string, assignee: string) {
  if (!(await isActionAllowed("reassign_ticket"))) {
    await logMelissaAction("action_blocked", {
      actionType: "reassign_ticket",
      ticketId,
      assignee,
    });
    return { ok: false, error: "Action not allowed by safety rules" };
  }

  const { error } = await sb()
    .from("support_tickets")
    .update({ assigned_to: assignee })
    .eq("id", ticketId);

  await logMelissaAction("reassign_ticket", { ticketId, assignee });
  return { ok: !error, error: error?.message ?? null };
}

export async function triggerPayoutRecheck(vendorId: string) {
  if (!(await isActionAllowed("payout_recheck"))) {
    await logMelissaAction("action_blocked", {
      actionType: "payout_recheck",
      vendorId,
    });
    return { ok: false, error: "Action not allowed by safety rules" };
  }

  const { error } = await sb()
    .from("vendor_payouts")
    .update({ recheck_requested: true })
    .eq("vendor_id", vendorId);

  await logMelissaAction("payout_recheck", { vendorId });
  return { ok: !error, error: error?.message ?? null };
}

export async function sendVendorReminder(vendorId: string, reason: string) {
  if (!(await isActionAllowed("vendor_reminder"))) {
    await logMelissaAction("action_blocked", {
      actionType: "vendor_reminder",
      vendorId,
      reason,
    });
    return { ok: false, error: "Action not allowed by safety rules" };
  }

  const { error } = await sb().from("vendor_alerts").insert({
    vendor_id: vendorId,
    reason,
    created_at: new Date().toISOString(),
  });

  await logMelissaAction("vendor_reminder", { vendorId, reason });
  return { ok: !error, error: error?.message ?? null };
}

export async function triggerComplianceReminder(userId: string) {
  if (!(await isActionAllowed("compliance_reminder"))) {
    await logMelissaAction("action_blocked", {
      actionType: "compliance_reminder",
      userId,
    });
    return { ok: false, error: "Action not allowed by safety rules" };
  }

  const { error } = await sb().from("user_alerts").insert({
    user_id: userId,
    type: "compliance",
    created_at: new Date().toISOString(),
  });

  await logMelissaAction("compliance_reminder", { userId });
  return { ok: !error, error: error?.message ?? null };
}

export async function flagVendor(vendorId: string, reason: string) {
  if (!(await isActionAllowed("flag_vendor"))) {
    await logMelissaAction("action_blocked", {
      actionType: "flag_vendor",
      vendorId,
      reason,
    });
    return { ok: false, error: "Action not allowed by safety rules" };
  }

  const { error } = await sb()
    .from("vendor_profiles")
    .update({
      flagged: true,
      flag_reason: reason,
      flagged_at: new Date().toISOString(),
    })
    .eq("id", vendorId);

  await logMelissaAction("flag_vendor", { vendorId, reason });
  return { ok: !error, error: error?.message ?? null };
}
