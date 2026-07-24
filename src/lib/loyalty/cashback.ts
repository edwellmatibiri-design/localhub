import { createServiceClient } from "@/lib/db";
import { awardPoints } from "@/lib/loyalty/awardPoints";

export const TIER_CASHBACK_PERCENT: Record<
  "bronze" | "silver" | "gold" | "platinum",
  number
> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 5,
};

export type CashbackInput = {
  userId: string;
  amount: number;
};

export function calculateCashbackPoints(
  amount: number,
  tier: "bronze" | "silver" | "gold" | "platinum",
) {
  const normalizedAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const percent = TIER_CASHBACK_PERCENT[tier] ?? 0;
  return Math.floor(normalizedAmount * (percent / 100));
}

export async function applyCashbackForBooking(input: CashbackInput) {
  const userId = String(input.userId ?? "").trim();
  if (!userId) {
    throw new Error("userId is required");
  }

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("loyalty_points")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const tier = String(row?.tier ?? "bronze") as
    | "bronze"
    | "silver"
    | "gold"
    | "platinum";
  const cashbackPoints = calculateCashbackPoints(Number(input.amount), tier);

  if (cashbackPoints <= 0) {
    return { ok: true as const, tier, cashbackPoints: 0 };
  }

  await awardPoints({
    userId,
    type: "promo_bonus",
    promoBonusPoints: cashbackPoints,
  });

  return { ok: true as const, tier, cashbackPoints };
}
