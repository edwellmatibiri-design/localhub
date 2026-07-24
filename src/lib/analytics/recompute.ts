import { createServiceClient } from "@/lib/db";

export type AnalyticsRecomputeSummary = {
  vendorsProcessed: number;
  marketplaceUpserted: boolean;
  snapshotDate: string;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function recomputeAnalytics(options?: {
  vendorId?: string;
  includeMarketplace?: boolean;
}) {
  const supabase = createServiceClient();
  const includeMarketplace = options?.includeMarketplace ?? true;

  const vendorQuery = supabase.from("seller_profiles").select("id");
  const { data: vendors, error: vendorsError } = options?.vendorId
    ? await vendorQuery.eq("id", options.vendorId)
    : await vendorQuery;

  if (vendorsError) {
    throw new Error(vendorsError.message);
  }

  const vendorIds = (vendors ?? [])
    .map((row) => String(row.id))
    .filter(Boolean);

  for (const vendorId of vendorIds) {
    const [
      { data: bookings },
      { data: payouts },
      { data: reviews },
      { data: conversations },
    ] = await Promise.all([
      supabase.from("bookings").select("id, status").eq("vendor_id", vendorId),
      supabase
        .from("payouts")
        .select("amount")
        .eq("vendor_id", vendorId)
        .eq("status", "paid"),
      supabase.from("reviews").select("rating").eq("vendor_id", vendorId),
      supabase.from("conversations").select("id").eq("vendor_id", vendorId),
    ]);

    const bookingRows = bookings ?? [];
    const totalBookings = bookingRows.length;
    const completedBookings = bookingRows.filter(
      (row) =>
        String(row.status) === "completed" ||
        String(row.status) === "confirmed",
    ).length;
    const cancelledBookings = bookingRows.filter(
      (row) => String(row.status) === "cancelled",
    ).length;

    const totalRevenue = Math.round(
      (payouts ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    );

    const reviewRows = reviews ?? [];
    const reviewCount = reviewRows.length;
    const avgRating = Number(
      average(reviewRows.map((row) => Number(row.rating) || 0)).toFixed(2),
    );

    const conversationIds = (conversations ?? [])
      .map((row) => Number(row.id))
      .filter((value) => Number.isFinite(value));
    let responseTimeAvg = 0;

    if (conversationIds.length > 0) {
      const { data: messages } = await supabase
        .from("messages")
        .select("conversation_id, sender_type, created_at")
        .in("conversation_id", conversationIds)
        .order("conversation_id", { ascending: true })
        .order("created_at", { ascending: true });

      const byConversation = new Map<
        number,
        Array<{ sender_type: string; created_at: string }>
      >();
      (messages ?? []).forEach((row) => {
        const conversationId = Number(row.conversation_id);
        byConversation.set(conversationId, [
          ...(byConversation.get(conversationId) ?? []),
          {
            sender_type: String(row.sender_type ?? ""),
            created_at: String(row.created_at ?? ""),
          },
        ]);
      });

      const deltasMinutes: number[] = [];
      byConversation.forEach((rows) => {
        let pendingUserAt: number | null = null;
        rows.forEach((row) => {
          const timestamp = Date.parse(row.created_at);
          if (Number.isNaN(timestamp)) return;

          if (row.sender_type === "user") {
            pendingUserAt = timestamp;
            return;
          }

          if (
            row.sender_type === "vendor" &&
            pendingUserAt !== null &&
            timestamp >= pendingUserAt
          ) {
            deltasMinutes.push(
              Math.round((timestamp - pendingUserAt) / (1000 * 60)),
            );
            pendingUserAt = null;
          }
        });
      });

      responseTimeAvg = deltasMinutes.length
        ? Math.round(average(deltasMinutes))
        : 0;
    }

    const { error: upsertVendorError } = await supabase
      .from("vendor_metrics")
      .upsert(
        {
          vendor_id: vendorId,
          total_bookings: totalBookings,
          completed_bookings: completedBookings,
          cancelled_bookings: cancelledBookings,
          total_revenue: totalRevenue,
          avg_rating: avgRating,
          review_count: reviewCount,
          response_time_avg: responseTimeAvg,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "vendor_id" },
      );

    if (upsertVendorError) {
      throw new Error(upsertVendorError.message);
    }
  }

  const snapshotDate = toIsoDate(new Date());

  if (includeMarketplace) {
    const [
      { count: totalUsers },
      { count: totalVendors },
      { count: totalListings },
      { count: totalBookings },
      payoutsRes,
      trustRes,
      freshnessRes,
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("seller_profiles")
        .select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("payouts").select("amount").eq("status", "paid"),
      supabase.from("vendor_trust_scores").select("trust_score"),
      supabase.from("freshness_scores").select("score"),
    ]);

    const totalRevenue = Math.round(
      (payoutsRes.data ?? []).reduce(
        (sum, row) => sum + (Number(row.amount) || 0),
        0,
      ),
    );
    const avgTrustScore = Number(
      average(
        (trustRes.data ?? []).map((row) => Number(row.trust_score) || 0),
      ).toFixed(2),
    );
    const avgFreshnessScore = Number(
      average(
        (freshnessRes.data ?? []).map((row) => Number(row.score) || 0),
      ).toFixed(2),
    );

    const { error: upsertMarketplaceError } = await supabase
      .from("marketplace_metrics")
      .upsert(
        {
          date: snapshotDate,
          total_users: totalUsers ?? 0,
          total_vendors: totalVendors ?? 0,
          total_listings: totalListings ?? 0,
          total_bookings: totalBookings ?? 0,
          total_revenue: totalRevenue,
          avg_trust_score: avgTrustScore,
          avg_freshness_score: avgFreshnessScore,
        },
        { onConflict: "date" },
      );

    if (upsertMarketplaceError) {
      throw new Error(upsertMarketplaceError.message);
    }
  }

  return {
    vendorsProcessed: vendorIds.length,
    marketplaceUpserted: includeMarketplace,
    snapshotDate,
  } satisfies AnalyticsRecomputeSummary;
}
