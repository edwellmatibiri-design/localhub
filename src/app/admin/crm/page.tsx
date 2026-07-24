import { createServiceClient } from "@/lib/db";
import type { CrmPipelineEventRow, CrmPipelineRow } from "@/lib/crm/pipeline";
import { summarizeForecast } from "@/lib/crm/forecast";
import { computeCrmAnalytics } from "@/lib/crm/analytics";

export const dynamic = "force-dynamic";

export default async function AdminCrmPage() {
  const supabase = createServiceClient();

  const [{ data: vendors }, { data: rows }, { data: events }] =
    await Promise.all([
      supabase.from("seller_profiles").select("id, business_name").limit(500),
      supabase
        .from("crm_pipeline")
        .select(
          "id, vendor_id, lead_id, quote_id, booking_id, stage, value_estimate, probability, updated_at, created_at",
        )
        .order("updated_at", { ascending: false }),
      supabase
        .from("crm_pipeline_events")
        .select(
          "id, pipeline_id, vendor_id, from_stage, to_stage, metadata, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

  const pipelineRows = (rows ?? []) as CrmPipelineRow[];
  const eventRows = (events ?? []) as CrmPipelineEventRow[];

  const vendorNameById = new Map<string, string>(
    (vendors ?? []).map((vendor) => [
      String(vendor.id),
      String(vendor.business_name ?? "Vendor"),
    ]),
  );

  const itemsByVendor = new Map<string, CrmPipelineRow[]>();
  for (const item of pipelineRows) {
    const key = String(item.vendor_id);
    const list = itemsByVendor.get(key) ?? [];
    list.push(item);
    itemsByVendor.set(key, list);
  }

  const eventsByVendor = new Map<string, CrmPipelineEventRow[]>();
  for (const event of eventRows) {
    const key = String(event.vendor_id);
    const list = eventsByVendor.get(key) ?? [];
    list.push(event);
    eventsByVendor.set(key, list);
  }

  const vendorMetrics = Array.from(itemsByVendor.entries()).map(
    ([vendorId, vendorItems]) => {
      const vendorEvents = eventsByVendor.get(vendorId) ?? [];
      const forecast = summarizeForecast(vendorItems);
      const analytics = computeCrmAnalytics(vendorItems, vendorEvents);
      const completedCount = vendorItems.filter(
        (item) => item.stage === "completed",
      ).length;

      return {
        vendorId,
        businessName: vendorNameById.get(vendorId) ?? "Vendor",
        pipelineCount: vendorItems.length,
        completedCount,
        conversionRate: analytics.conversionRate,
        quoteToBookingRate: analytics.quoteToBookingRate,
        projectedRevenue: forecast.vendorForecastRevenue,
        weightedPipelineValue: forecast.weightedPipelineValue,
        pipelineValue: forecast.pipelineValue,
      };
    },
  );

  const underperforming = vendorMetrics
    .filter(
      (row) =>
        row.pipelineCount >= 3 &&
        (row.conversionRate < 0.15 || row.quoteToBookingRate < 0.3),
    )
    .sort((a, b) => a.conversionRate - b.conversionRate)
    .slice(0, 20);

  const highValue = [...vendorMetrics]
    .sort((a, b) => b.weightedPipelineValue - a.weightedPipelineValue)
    .slice(0, 20);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin CRM Oversight</h1>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">High-Value Vendors</h2>
        {highValue.length === 0 ? (
          <p className="text-lh-muted text-sm">
            No high-value vendors identified yet.
          </p>
        ) : (
          highValue.map((row) => (
            <article
              key={row.vendorId}
              className="border-lh-border space-y-1 rounded border p-3 text-sm"
            >
              <p className="font-medium">{row.businessName}</p>
              <p className="text-lh-muted">Vendor: {row.vendorId}</p>
              <p className="text-lh-muted">
                Projected revenue: R{" "}
                {Math.round(row.projectedRevenue).toLocaleString("en-ZA")}
              </p>
              <p className="text-lh-muted">
                Conversion: {(row.conversionRate * 100).toFixed(1)}%
              </p>
            </article>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Underperforming Vendors</h2>
        {underperforming.length === 0 ? (
          <p className="text-lh-muted text-sm">
            No underperforming vendors identified by current thresholds.
          </p>
        ) : (
          underperforming.map((row) => (
            <article
              key={row.vendorId}
              className="border-lh-border space-y-1 rounded border p-3 text-sm"
            >
              <p className="font-medium">{row.businessName}</p>
              <p className="text-lh-muted">Vendor: {row.vendorId}</p>
              <p className="text-lh-muted">
                Conversion: {(row.conversionRate * 100).toFixed(1)}%
              </p>
              <p className="text-lh-muted">
                Quote-to-booking: {(row.quoteToBookingRate * 100).toFixed(1)}%
              </p>
            </article>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Vendor Pipelines</h2>
        {vendorMetrics.length === 0 ? (
          <p className="text-lh-muted text-sm">No CRM pipeline data found.</p>
        ) : (
          vendorMetrics.map((row) => (
            <article
              key={row.vendorId}
              className="border-lh-border grid gap-1 rounded border p-3 text-sm md:grid-cols-2 xl:grid-cols-4"
            >
              <p>
                <span className="font-medium">{row.businessName}</span> (
                {row.vendorId})
              </p>
              <p className="text-lh-muted">
                Pipeline items: {row.pipelineCount}
              </p>
              <p className="text-lh-muted">
                Conversion rate: {(row.conversionRate * 100).toFixed(1)}%
              </p>
              <p className="text-lh-muted">
                Projected revenue: R{" "}
                {Math.round(row.projectedRevenue).toLocaleString("en-ZA")}
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
