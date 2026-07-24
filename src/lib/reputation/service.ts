import { createServiceClient } from "@/lib/db";
import { calculateReputationScore } from "@/lib/reputation/calculate";
import { getReputationTier } from "@/lib/reputation/tiers";

export const REPUTATION_EVENT_TYPES = [
  "booking_completed",
  "booking_cancelled",
  "payment_on_time",
  "payment_late",
  "dispute_opened",
  "dispute_resolved",
  "abusive_flag",
  "positive_feedback",
  "negative_feedback",
] as const;

export type ReputationEventType = (typeof REPUTATION_EVENT_TYPES)[number];

export type UserReputationRow = {
  id: number;
  user_id: string;
  reputation_score: number;
  positive_events: number;
  negative_events: number;
  completed_bookings: number;
  cancelled_bookings: number;
  on_time_payments: number;
  late_payments: number;
  dispute_count: number;
  abusive_flags: number;
  created_at: string;
  updated_at: string;
};

export async function ensureUserReputation(userIdInput: string) {
  const userId = String(userIdInput ?? "").trim();
  if (!userId) throw new Error("userId is required");

  const supabase = createServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("user_reputation")
    .select(
      "id, user_id, reputation_score, positive_events, negative_events, completed_bookings, cancelled_bookings, on_time_payments, late_payments, dispute_count, abusive_flags, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing as UserReputationRow;

  const { data: inserted, error: insertError } = await supabase
    .from("user_reputation")
    .insert({ user_id: userId })
    .select(
      "id, user_id, reputation_score, positive_events, negative_events, completed_bookings, cancelled_bookings, on_time_payments, late_payments, dispute_count, abusive_flags, created_at, updated_at",
    )
    .single();

  if (insertError) throw new Error(insertError.message);
  return inserted as UserReputationRow;
}

function applyEventCounters(row: UserReputationRow, type: ReputationEventType) {
  const next = {
    positive_events: Number(row.positive_events ?? 0),
    negative_events: Number(row.negative_events ?? 0),
    completed_bookings: Number(row.completed_bookings ?? 0),
    cancelled_bookings: Number(row.cancelled_bookings ?? 0),
    on_time_payments: Number(row.on_time_payments ?? 0),
    late_payments: Number(row.late_payments ?? 0),
    dispute_count: Number(row.dispute_count ?? 0),
    abusive_flags: Number(row.abusive_flags ?? 0),
  };

  if (type === "booking_completed") {
    next.completed_bookings += 1;
    next.positive_events += 1;
  }
  if (type === "booking_cancelled") {
    next.cancelled_bookings += 1;
    next.negative_events += 1;
  }
  if (type === "payment_on_time") {
    next.on_time_payments += 1;
    next.positive_events += 1;
  }
  if (type === "payment_late") {
    next.late_payments += 1;
    next.negative_events += 1;
  }
  if (type === "dispute_opened") {
    next.dispute_count += 1;
    next.negative_events += 1;
  }
  if (type === "dispute_resolved") {
    next.negative_events += 1;
  }
  if (type === "abusive_flag") {
    next.abusive_flags += 1;
    next.negative_events += 1;
  }
  if (type === "positive_feedback") {
    next.positive_events += 1;
  }
  if (type === "negative_feedback") {
    next.negative_events += 1;
  }

  return next;
}

export async function logReputationEvent(input: {
  userId: string;
  type: ReputationEventType;
}) {
  const userId = String(input.userId ?? "").trim();
  const type = input.type;

  if (!userId) throw new Error("userId is required");
  if (!REPUTATION_EVENT_TYPES.includes(type))
    throw new Error("Invalid reputation event type");

  const supabase = createServiceClient();
  const current = await ensureUserReputation(userId);
  const nextCounters = applyEventCounters(current, type);
  const nextScore = calculateReputationScore(nextCounters);

  const previousScore = Number(current.reputation_score ?? 50);
  const previousTier = getReputationTier(previousScore);
  const nextTier = getReputationTier(nextScore);

  const { error: updateError } = await supabase
    .from("user_reputation")
    .update({
      ...nextCounters,
      reputation_score: nextScore,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  if (nextScore > previousScore) {
    await supabase.from("notifications").insert({
      user_id: userId,
      vendor_id: null,
      type: "reputation_increased",
      message: `Your reputation score has increased to ${nextScore}.`,
    });
  }

  if (nextScore < previousScore) {
    await supabase.from("notifications").insert({
      user_id: userId,
      vendor_id: null,
      type: "reputation_decreased",
      message: `Your reputation score has decreased to ${nextScore}.`,
    });
  }

  if (previousTier !== nextTier && nextTier === "Trusted") {
    await supabase.from("notifications").insert({
      user_id: userId,
      vendor_id: null,
      type: "reputation_trusted",
      message: "You are now a Trusted User.",
    });
  }

  if (previousTier !== nextTier && nextTier === "Premium") {
    await supabase.from("notifications").insert({
      user_id: userId,
      vendor_id: null,
      type: "reputation_premium",
      message: "You are now a Premium User.",
    });
  }

  if (nextTier === "High Risk") {
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: "admin",
      type: "high_risk_user_detected",
      message: `High-risk user detected (${userId}) with reputation ${nextScore}.`,
    });
  }

  return { ok: true as const, reputationScore: nextScore, tier: nextTier };
}
