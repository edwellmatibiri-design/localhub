import { createServiceClient } from "@/lib/db";
import { computeUserTrustScore } from "@/lib/trust/userTrustScore";

export type TrustProfileRow = {
  id: number;
  user_id: string;
  phone_verified: boolean;
  email_verified: boolean;
  device_verified: boolean;
  multi_account_risk: number;
  cancellation_rate: number;
  dispute_count: number;
  abusive_flags: number;
  trust_score: number;
  bookings_locked: boolean;
  created_at: string;
  updated_at: string;
};

export async function ensureTrustProfile(userIdInput: string) {
  const userId = String(userIdInput ?? "").trim();
  if (!userId) throw new Error("userId is required");

  const supabase = createServiceClient();

  const { data: existing, error: existingError } = await supabase
    .from("user_trust_profile")
    .select(
      "id, user_id, phone_verified, email_verified, device_verified, multi_account_risk, cancellation_rate, dispute_count, abusive_flags, trust_score, bookings_locked, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing as TrustProfileRow;

  const { data: inserted, error: insertError } = await supabase
    .from("user_trust_profile")
    .insert({ user_id: userId })
    .select(
      "id, user_id, phone_verified, email_verified, device_verified, multi_account_risk, cancellation_rate, dispute_count, abusive_flags, trust_score, bookings_locked, created_at, updated_at",
    )
    .single();

  if (insertError) throw new Error(insertError.message);
  return inserted as TrustProfileRow;
}

export async function refreshCancellationAndDispute(userIdInput: string) {
  const userId = String(userIdInput ?? "").trim();
  if (!userId) throw new Error("userId is required");

  const supabase = createServiceClient();
  const [
    { count: totalBookings },
    { count: cancelledBookings },
    { count: disputes },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "cancelled"),
    supabase
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const total = Number(totalBookings ?? 0);
  const cancelled = Number(cancelledBookings ?? 0);
  const cancellationRate =
    total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const disputeCount = Number(disputes ?? 0);

  const { error } = await supabase
    .from("user_trust_profile")
    .update({
      cancellation_rate: cancellationRate,
      dispute_count: disputeCount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return { cancellationRate, disputeCount };
}

export async function recalculateAndPersistTrustScore(
  userIdInput: string,
  reason: string,
) {
  const userId = String(userIdInput ?? "").trim();
  if (!userId) throw new Error("userId is required");

  const supabase = createServiceClient();
  const profile = await ensureTrustProfile(userId);
  const nextScore = computeUserTrustScore(profile);

  if (nextScore !== Number(profile.trust_score ?? 50)) {
    const { error: updateError } = await supabase
      .from("user_trust_profile")
      .update({ trust_score: nextScore, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (updateError) throw new Error(updateError.message);

    await supabase.from("notifications").insert({
      user_id: userId,
      vendor_id: null,
      type: "trust_score_changed",
      message: `Your trust score has changed to ${nextScore}. Reason: ${reason}`,
    });

    if (nextScore < 20) {
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: "admin",
        type: "high_risk_user_detected",
        message: `High-risk user detected (${userId}) with trust score ${nextScore}.`,
      });
    }
  }

  return nextScore;
}
