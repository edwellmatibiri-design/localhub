import { createServiceClient } from "@/lib/db";
import {
  ensureTrustProfile,
  recalculateAndPersistTrustScore,
} from "@/lib/trust/profile";

export const USER_FLAG_TYPES = [
  "abusive_message",
  "spam_lead",
  "repeated_cancellation",
  "fraud_suspected",
] as const;

export type UserFlagType = (typeof USER_FLAG_TYPES)[number];

const FLAG_PENALTIES: Record<UserFlagType, number> = {
  abusive_message: 30,
  spam_lead: 20,
  repeated_cancellation: 10,
  fraud_suspected: 30,
};

export async function flagUser(input: {
  userId: string;
  flagType: UserFlagType;
}) {
  const userId = String(input.userId ?? "").trim();
  if (!userId) throw new Error("userId is required");

  const penalty = FLAG_PENALTIES[input.flagType] ?? 10;
  const profile = await ensureTrustProfile(userId);

  const supabase = createServiceClient();
  const abusiveFlags = Number(profile.abusive_flags ?? 0) + 1;
  const provisionalScore = Math.max(
    0,
    Number(profile.trust_score ?? 50) - penalty,
  );

  const { error } = await supabase
    .from("user_trust_profile")
    .update({
      abusive_flags: abusiveFlags,
      trust_score: provisionalScore,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  await supabase.from("notifications").insert({
    user_id: null,
    vendor_id: "admin",
    type: "high_risk_user_detected",
    message: `User ${userId} flagged for ${input.flagType}.`,
  });

  await recalculateAndPersistTrustScore(userId, `flag:${input.flagType}`);

  return { ok: true as const, penalty };
}
