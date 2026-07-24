import { createServiceClient } from "@/lib/db";
import { awardPoints } from "@/lib/loyalty/awardPoints";

export async function completeReferralOnFirstBooking(userIdInput: string) {
  const userId = String(userIdInput ?? "").trim();
  if (!userId) {
    throw new Error("userId is required");
  }

  const supabase = createServiceClient();

  const [{ count: completedBookings }, { data: userRow }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase.from("users").select("email").eq("id", userId).maybeSingle(),
  ]);

  if (Number(completedBookings ?? 0) < 1) {
    return {
      ok: true as const,
      completed: false,
      reason: "No completed booking yet",
    };
  }

  const userEmail = String(userRow?.email ?? "")
    .trim()
    .toLowerCase();

  let query = supabase
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("status", "pending")
    .eq("referred_id", userId)
    .limit(1);

  if (userEmail) {
    query = supabase
      .from("referrals")
      .select("id, referrer_id, status")
      .eq("status", "pending")
      .or(`referred_id.eq.${userId},referred_id.eq.${userEmail}`)
      .limit(1);
  }

  const { data: referral } = await query.maybeSingle();

  if (!referral) {
    return {
      ok: true as const,
      completed: false,
      reason: "No pending referral",
    };
  }

  await awardPoints({
    userId: String(referral.referrer_id),
    type: "referral_bonus",
  });

  const { error: updateError } = await supabase
    .from("referrals")
    .update({ status: "completed" })
    .eq("id", referral.id);
  if (updateError) throw new Error(updateError.message);

  return {
    ok: true as const,
    completed: true,
    referralId: Number(referral.id),
  };
}
