export type UserTrustProfile = {
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  device_verified?: boolean | null;
  multi_account_risk?: number | null;
  cancellation_rate?: number | null;
  dispute_count?: number | null;
  abusive_flags?: number | null;
};

export function computeUserTrustScore(profile: UserTrustProfile) {
  let score = 50;

  if (profile.phone_verified) score += 10;
  if (profile.email_verified) score += 10;
  if (profile.device_verified) score += 5;

  if (Number(profile.multi_account_risk ?? 0) > 20) score -= 20;

  const cancellationRate = Number(profile.cancellation_rate ?? 0);
  if (cancellationRate > 50) {
    score -= 40;
  } else if (cancellationRate > 30) {
    score -= 20;
  }

  if (Number(profile.dispute_count ?? 0) > 2) score -= 20;
  if (Number(profile.abusive_flags ?? 0) > 0) score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
}
