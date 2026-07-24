import { createServiceClient } from "@/lib/db";
import { recomputeAnalytics } from "@/lib/analytics/recompute";
import {
  fetchVendorMetrics,
  fetchVendorTrend,
} from "@/lib/analytics/fetchMetrics";
import MetricCard from "@/components/analytics/MetricCard";
import ChartCard from "@/components/analytics/ChartCard";
import TrendGraph from "@/components/analytics/TrendGraph";

type SearchParams = {
  vendorId?: string;
};

export const dynamic = "force-dynamic";

export default async function VendorAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();
  const requestedVendorId = String(params.vendorId ?? "").trim();

  const vendorId =
    requestedVendorId ||
    String(
      (
        await supabase
          .from("seller_profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data?.id ?? "",
    );

  if (vendorId) {
    await recomputeAnalytics({ vendorId, includeMarketplace: false });
  }

  const [metrics, trend] = await Promise.all([
    vendorId ? fetchVendorMetrics(vendorId) : Promise.resolve(null),
    vendorId
      ? fetchVendorTrend(vendorId)
      : Promise.resolve({ bookings: [], revenue: [], rating: [] }),
  ]);

  const totalBookings = Number(metrics?.total_bookings ?? 0);
  const completedBookings = Number(metrics?.completed_bookings ?? 0);
  const cancelledBookings = Number(metrics?.cancelled_bookings ?? 0);
  const cancellationRate = totalBookings
    ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
    : "0.0";

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Analytics</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Bookings" value={String(totalBookings)} />
        <MetricCard
          label="Completed Bookings"
          value={String(completedBookings)}
        />
        <MetricCard label="Cancellation Rate" value={`${cancellationRate}%`} />
        <MetricCard
          label="Total Revenue"
          value={`R ${Number(metrics?.total_revenue ?? 0).toLocaleString("en-ZA")}`}
        />
        <MetricCard
          label="Avg Rating"
          value={Number(metrics?.avg_rating ?? 0).toFixed(2)}
        />
        <MetricCard
          label="Review Count"
          value={String(metrics?.review_count ?? 0)}
        />
        <MetricCard
          label="Response Time"
          value={`${Number(metrics?.response_time_avg ?? 0)} min`}
        />
        <MetricCard
          label="Last Updated"
          value={
            metrics?.updated_at
              ? new Date(String(metrics.updated_at)).toLocaleString()
              : "-"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Bookings Over Time">
          <TrendGraph points={trend.bookings} />
        </ChartCard>
        <ChartCard
          title="Revenue Over Time"
          subtitle="Payout-backed revenue trend"
        >
          <TrendGraph points={trend.revenue} colorClass="bg-lh-emerald/70" />
        </ChartCard>
        <ChartCard title="Rating Trend">
          <TrendGraph points={trend.rating} colorClass="bg-lh-amber/80" />
        </ChartCard>
      </div>
    </section>
  );
}
