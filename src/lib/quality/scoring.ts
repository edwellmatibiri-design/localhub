import { createServiceClient } from "@/lib/db";

export type VendorQualitySignals = {
  cancellationRate: number;
  responseTimeAvgHours: number;
  disputeCount: number;
  verifiedReviewRatio: number;
  spamFlagsCount: number;
  boostFraudFlagsCount: number;
};

export function computeVendorQualityScoreFromSignals(
  signals: VendorQualitySignals,
) {
  const cancellationPenalty = Math.min(
    30,
    Math.max(0, signals.cancellationRate) * 0.5,
  );
  const responsePenalty = Math.min(
    20,
    Math.max(0, signals.responseTimeAvgHours) * 0.5,
  );
  const disputePenalty = Math.min(15, Math.max(0, signals.disputeCount) * 3);
  const reviewBonus = Math.max(
    0,
    Math.min(20, signals.verifiedReviewRatio * 20),
  );
  const spamPenalty = Math.min(15, Math.max(0, signals.spamFlagsCount) * 3);
  const boostFraudPenalty = Math.min(
    20,
    Math.max(0, signals.boostFraudFlagsCount) * 6,
  );

  const raw =
    100 -
    cancellationPenalty -
    responsePenalty -
    disputePenalty -
    spamPenalty -
    boostFraudPenalty +
    reviewBonus;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export async function getVendorQualityData(vendorId: string) {
  const supabase = createServiceClient();

  const [
    { data: metric },
    { data: disputes },
    { data: reviews },
    { data: flags },
  ] = await Promise.all([
    supabase
      .from("vendor_metrics")
      .select("total_bookings, cancelled_bookings, response_time_avg")
      .eq("vendor_id", vendorId)
      .maybeSingle(),
    supabase
      .from("disputes")
      .select("id")
      .eq("vendor_id", vendorId)
      .in("status", ["open", "under_review"]),
    supabase.from("reviews").select("id, verified").eq("vendor_id", vendorId),
    supabase
      .from("quality_flags")
      .select("type")
      .eq("vendor_id", vendorId)
      .eq("resolved", false),
  ]);

  const totalBookings = Number(metric?.total_bookings ?? 0);
  const cancelledBookings = Number(metric?.cancelled_bookings ?? 0);
  const cancellationRate =
    totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
  const responseTimeAvgHours =
    (Number(metric?.response_time_avg ?? 0) || 0) / 60;

  const totalReviews = (reviews ?? []).length;
  const verifiedReviews = (reviews ?? []).filter((review) =>
    Boolean(review.verified),
  ).length;
  const verifiedReviewRatio =
    totalReviews > 0 ? verifiedReviews / totalReviews : 0;

  const spamFlagsCount = (flags ?? []).filter(
    (flag) => String(flag.type) === "spam_listing",
  ).length;
  const boostFraudFlagsCount = (flags ?? []).filter(
    (flag) => String(flag.type) === "boost_fraud",
  ).length;

  const signals: VendorQualitySignals = {
    cancellationRate,
    responseTimeAvgHours,
    disputeCount: (disputes ?? []).length,
    verifiedReviewRatio,
    spamFlagsCount,
    boostFraudFlagsCount,
  };

  const vendorQualityScore = computeVendorQualityScoreFromSignals(signals);
  return { vendorQualityScore, signals };
}
