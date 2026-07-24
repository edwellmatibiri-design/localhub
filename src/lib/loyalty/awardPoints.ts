import { createServiceClient } from "@/lib/db";

export const POINT_TRANSACTION_TYPES = [
  "booking_completed",
  "review_written",
  "referral_bonus",
  "promo_bonus",
  "admin_adjustment",
] as const;

export type PointTransactionType = (typeof POINT_TRANSACTION_TYPES)[number];

export type AwardPointsInput = {
  userId: string;
  type: PointTransactionType;
  promoBonusPoints?: number;
  adjustmentPoints?: number;
};

export function resolveTier(
  lifetimePoints: number,
): "bronze" | "silver" | "gold" | "platinum" {
  if (lifetimePoints >= 5000) return "platinum";
  if (lifetimePoints >= 1500) return "gold";
  if (lifetimePoints >= 500) return "silver";
  return "bronze";
}

export function resolvePointsDelta(input: AwardPointsInput): number {
  if (input.type === "booking_completed") return 50;
  if (input.type === "review_written") return 10;
  if (input.type === "referral_bonus") return 100;
  if (input.type === "promo_bonus")
    return Math.round(Number(input.promoBonusPoints ?? 0));
  if (input.type === "admin_adjustment")
    return Math.round(Number(input.adjustmentPoints ?? 0));
  return 0;
}

export async function awardPoints(input: AwardPointsInput) {
  const userId = String(input.userId ?? "").trim();
  if (!userId) {
    throw new Error("userId is required");
  }

  const delta = resolvePointsDelta(input);
  if (!Number.isFinite(delta) || delta === 0) {
    return {
      ok: true as const,
      pointsDelta: 0,
      points: 0,
      lifetimePoints: 0,
      tier: "bronze" as const,
    };
  }

  const supabase = createServiceClient();

  const { data: current, error: currentError } = await supabase
    .from("loyalty_points")
    .select("id, user_id, points, lifetime_points, tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (currentError) throw new Error(currentError.message);

  const currentPoints = Number(current?.points ?? 0);
  const currentLifetime = Number(current?.lifetime_points ?? 0);

  const nextPoints = Math.max(0, currentPoints + delta);
  const nextLifetime = Math.max(0, currentLifetime + Math.max(0, delta));
  const nextTier = resolveTier(nextLifetime);

  const { error: upsertError } = await supabase.from("loyalty_points").upsert(
    {
      user_id: userId,
      points: nextPoints,
      lifetime_points: nextLifetime,
      tier: nextTier,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) throw new Error(upsertError.message);

  const { error: transactionError } = await supabase
    .from("points_transactions")
    .insert({
      user_id: userId,
      points: delta,
      type: input.type,
    });

  if (transactionError) throw new Error(transactionError.message);

  return {
    ok: true as const,
    pointsDelta: delta,
    points: nextPoints,
    lifetimePoints: nextLifetime,
    tier: nextTier,
  };
}
