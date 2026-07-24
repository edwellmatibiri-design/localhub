import { createServiceClient } from "@/lib/db";

const LISTING_BANNED_KEYWORDS = [
  "scam",
  "bitcoin only",
  "wire transfer only",
  "adult service",
  "counterfeit",
];
const MESSAGE_BANNED_KEYWORDS = ["idiot", "stupid", "hate", "kill", "scam"];

function hasKeyword(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

async function createFlagIfMissing(params: {
  vendorId?: string | null;
  userId?: string | null;
  listingId?: number | null;
  reviewId?: number | null;
  type:
    | "spam_listing"
    | "duplicate_listing"
    | "abusive_message"
    | "fake_review"
    | "suspicious_activity"
    | "high_cancellation_rate"
    | "low_response_rate"
    | "boost_fraud";
  severity: number;
  notes: string;
}) {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("quality_flags")
    .select("id")
    .eq("type", params.type)
    .eq("resolved", false)
    .eq("vendor_id", params.vendorId ?? null)
    .eq("user_id", params.userId ?? null)
    .order("created_at", { ascending: false })
    .limit(1);

  if ((existing ?? []).length > 0) {
    return false;
  }

  await supabase.from("quality_flags").insert({
    vendor_id: params.vendorId ?? null,
    user_id: params.userId ?? null,
    listing_id: params.listingId ?? null,
    review_id: params.reviewId ?? null,
    type: params.type,
    severity: Math.max(1, Math.min(5, Math.round(params.severity))),
    notes: params.notes,
  });

  if (params.severity >= 4) {
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: "admin",
      type: "high_severity_flag",
      message: `High severity flag detected: ${params.type}. ${params.notes}`,
    });
  }

  if (params.vendorId) {
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: params.vendorId,
      type: "account_flagged",
      message: "Your account has been flagged for quality review.",
    });
  }

  if (params.userId && params.type === "fake_review") {
    await supabase.from("notifications").insert({
      user_id: params.userId,
      vendor_id: null,
      type: "review_flagged_verification",
      message: "Your review was flagged for verification.",
    });
  }

  return true;
}

export async function runAutoFlagging() {
  const supabase = createServiceClient();
  let created = 0;

  const { data: listings } = await supabase
    .from("listings")
    .select("id, seller_id, title, description")
    .eq("is_active", true)
    .limit(500);

  const titleCounts = new Map<string, number>();
  (listings ?? []).forEach((listing) => {
    const key = String(listing.title ?? "")
      .trim()
      .toLowerCase();
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  });

  for (const listing of listings ?? []) {
    const titleKey = String(listing.title ?? "")
      .trim()
      .toLowerCase();
    if ((titleCounts.get(titleKey) ?? 0) > 3) {
      const inserted = await createFlagIfMissing({
        vendorId: String(listing.seller_id ?? ""),
        type: "duplicate_listing",
        severity: 3,
        notes: `Repeated listing title detected: ${listing.title}`,
      });
      if (inserted) created += 1;
    }

    if (
      hasKeyword(String(listing.description ?? ""), LISTING_BANNED_KEYWORDS)
    ) {
      const inserted = await createFlagIfMissing({
        vendorId: String(listing.seller_id ?? ""),
        type: "spam_listing",
        severity: 4,
        notes: `Banned listing keyword found. Listing ref: ${listing.id}`,
      });
      if (inserted) created += 1;
    }
  }

  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("id, user_id, vendor_id, rating, created_at")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1000);

  const reviewCountsByUser = new Map<string, number>();
  (recentReviews ?? []).forEach((review) => {
    const userId = String(review.user_id ?? "");
    reviewCountsByUser.set(userId, (reviewCountsByUser.get(userId) ?? 0) + 1);
  });

  const uniqueUserIds = Array.from(
    new Set(
      (recentReviews ?? [])
        .map((review) => String(review.user_id ?? ""))
        .filter(Boolean),
    ),
  );
  const { data: users } = uniqueUserIds.length
    ? await supabase
        .from("users")
        .select("id, created_at")
        .in("id", uniqueUserIds)
    : { data: [] as Array<{ id: string; created_at: string }> };
  const userCreatedById = new Map<string, string>(
    (users ?? []).map((user) => [String(user.id), String(user.created_at)]),
  );

  for (const review of recentReviews ?? []) {
    const userId = String(review.user_id ?? "");
    const vendorId = String(review.vendor_id ?? "");

    if ((reviewCountsByUser.get(userId) ?? 0) > 3) {
      const inserted = await createFlagIfMissing({
        vendorId,
        userId,
        reviewId: Number(review.id) || null,
        type: "fake_review",
        severity: 4,
        notes: "User posted more than 3 reviews in 24 hours.",
      });
      if (inserted) created += 1;
    }

    const rating = Number(review.rating ?? 0);
    const createdAt = Date.parse(userCreatedById.get(userId) ?? "");
    const isNewAccount =
      Number.isFinite(createdAt) &&
      Date.now() - createdAt <= 7 * 24 * 60 * 60 * 1000;
    if ((rating === 1 || rating === 5) && isNewAccount) {
      const inserted = await createFlagIfMissing({
        vendorId,
        userId,
        reviewId: Number(review.id) || null,
        type: "fake_review",
        severity: 3,
        notes: "Extreme rating from new account.",
      });
      if (inserted) created += 1;
    }
  }

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("sender_type, sender_id, message")
    .limit(1000);
  for (const message of recentMessages ?? []) {
    if (!hasKeyword(String(message.message ?? ""), MESSAGE_BANNED_KEYWORDS)) {
      continue;
    }

    const senderType = String(message.sender_type ?? "");
    const senderId = String(message.sender_id ?? "");
    const inserted = await createFlagIfMissing({
      vendorId: senderType === "vendor" ? senderId : null,
      userId: senderType === "user" ? senderId : null,
      type: "abusive_message",
      severity: 4,
      notes: "Abusive keyword found in message.",
    });
    if (inserted) created += 1;
  }

  const { data: vendorMetrics } = await supabase
    .from("vendor_metrics")
    .select("vendor_id, total_bookings, cancelled_bookings, response_time_avg")
    .limit(2000);

  for (const metric of vendorMetrics ?? []) {
    const vendorId = String(metric.vendor_id ?? "");
    const totalBookings = Number(metric.total_bookings ?? 0);
    const cancelledBookings = Number(metric.cancelled_bookings ?? 0);
    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
    const responseMinutes = Number(metric.response_time_avg ?? 0);

    if (cancellationRate > 40) {
      const inserted = await createFlagIfMissing({
        vendorId,
        type: "high_cancellation_rate",
        severity: 4,
        notes: `Cancellation rate is ${cancellationRate.toFixed(1)}%.`,
      });
      if (inserted) created += 1;
    }

    if (responseMinutes > 24 * 60) {
      const inserted = await createFlagIfMissing({
        vendorId,
        type: "low_response_rate",
        severity: 3,
        notes: `Response time average is ${(responseMinutes / 60).toFixed(1)} hours.`,
      });
      if (inserted) created += 1;
    }

    if (cancellationRate > 40 || responseMinutes > 24 * 60) {
      const inserted = await createFlagIfMissing({
        vendorId,
        type: "suspicious_activity",
        severity: 3,
        notes: "Vendor has suspicious performance activity.",
      });
      if (inserted) created += 1;
    }
  }

  const { data: pendingBoosts } = await supabase
    .from("boosts")
    .select("vendor_id, created_at")
    .eq("status", "pending_payment")
    .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .limit(1000);

  const failedAttemptsByVendor = new Map<string, number>();
  (pendingBoosts ?? []).forEach((boost) => {
    const vendorId = String(boost.vendor_id ?? "");
    failedAttemptsByVendor.set(
      vendorId,
      (failedAttemptsByVendor.get(vendorId) ?? 0) + 1,
    );
  });

  for (const [vendorId, count] of failedAttemptsByVendor.entries()) {
    if (count >= 3) {
      const inserted = await createFlagIfMissing({
        vendorId,
        type: "boost_fraud",
        severity: 5,
        notes: `Multiple failed boost payment attempts detected (${count}).`,
      });
      if (inserted) created += 1;
    }
  }

  return { createdFlags: created };
}
