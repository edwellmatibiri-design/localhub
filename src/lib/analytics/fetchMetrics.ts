import { createServiceClient } from "@/lib/db";

export async function fetchVendorMetrics(vendorId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("vendor_metrics")
    .select(
      "vendor_id, total_bookings, completed_bookings, cancelled_bookings, total_revenue, avg_rating, review_count, response_time_avg, updated_at",
    )
    .eq("vendor_id", vendorId)
    .maybeSingle();

  return data ?? null;
}

export async function fetchMarketplaceMetrics() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("marketplace_metrics")
    .select(
      "date, total_users, total_vendors, total_listings, total_bookings, total_revenue, avg_trust_score, avg_freshness_score",
    )
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function fetchVendorTrend(vendorId: string) {
  const supabase = createServiceClient();

  const [{ data: bookings }, { data: payouts }, { data: reviews }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("created_at, status")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: true }),
      supabase
        .from("payouts")
        .select("created_at, amount, status")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: true }),
      supabase
        .from("reviews")
        .select("created_at, rating")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: true }),
    ]);

  const bookingTrend = (bookings ?? []).map((row) => ({
    label: String(row.created_at).slice(0, 10),
    value: String(row.status) === "cancelled" ? 0 : 1,
  }));

  const revenueTrend = (payouts ?? [])
    .filter((row) => String(row.status) === "paid")
    .map((row) => ({
      label: String(row.created_at).slice(0, 10),
      value: Number(row.amount) || 0,
    }));

  const ratingTrend = (reviews ?? []).map((row) => ({
    label: String(row.created_at).slice(0, 10),
    value: Number(row.rating) || 0,
  }));

  return {
    bookings: bookingTrend,
    revenue: revenueTrend,
    rating: ratingTrend,
  };
}

export async function fetchMarketplaceTrend() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("marketplace_metrics")
    .select(
      "date, total_users, total_vendors, total_listings, total_bookings, total_revenue, avg_trust_score",
    )
    .order("date", { ascending: true })
    .limit(60);

  const rows = data ?? [];

  return {
    growth: rows.map((row) => ({
      label: String(row.date),
      value: Number(row.total_users) || 0,
    })),
    revenue: rows.map((row) => ({
      label: String(row.date),
      value: Number(row.total_revenue) || 0,
    })),
    bookings: rows.map((row) => ({
      label: String(row.date),
      value: Number(row.total_bookings) || 0,
    })),
    trust: rows.map((row) => ({
      label: String(row.date),
      value: Number(row.avg_trust_score) || 0,
    })),
  };
}
