import { awardPoints } from "@/lib/loyalty/awardPoints";
import { applyCashbackForBooking } from "@/lib/loyalty/cashback";
import { syncUserBadges } from "@/lib/loyalty/badges";
import { completeReferralOnFirstBooking } from "@/lib/referrals/completeReferral";

export async function runBookingCompletionRewards(input: {
  userId: string;
  paymentAmount?: number | null;
}) {
  const userId = String(input.userId ?? "").trim();
  if (!userId) {
    throw new Error("userId is required");
  }

  await awardPoints({
    userId,
    type: "booking_completed",
  });

  await applyCashbackForBooking({
    userId,
    amount: Number(input.paymentAmount ?? 0),
  });

  await syncUserBadges(userId);
  await completeReferralOnFirstBooking(userId);

  return { ok: true as const };
}
