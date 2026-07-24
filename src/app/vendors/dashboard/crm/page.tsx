import { createServiceClient } from "@/lib/db";
import type {
  CrmPipelineEventRow,
  CrmPipelineRow,
  CrmStage,
} from "@/lib/crm/pipeline";
import { summarizeForecast } from "@/lib/crm/forecast";
import { computeCrmAnalytics } from "@/lib/crm/analytics";
import { buildCrmNotifications } from "@/lib/crm/notifications";
import CRMKanban from "@/components/crm/CRMKanban";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string };

const STAGE_LABELS: Record<CrmStage, string> = {
  new_lead: "New Leads",
  contacted: "Contacted",
  quote_sent: "Quote Sent",
  negotiation: "Negotiation",
  awaiting_payment: "Awaiting Payment",
  booked: "Booked",
  completed: "Completed",
  lost: "Lost",
};

export default async function VendorCrmDashboard({
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

  if (!vendorId) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-muted text-sm">No vendor selected.</p>
        </div>
      </section>
    );
  }

  const [{ data: pipelineRows }, { data: eventRows }] = await Promise.all([
    supabase
      .from("crm_pipeline")
      .select(
        "id, vendor_id, lead_id, quote_id, booking_id, stage, value_estimate, probability, updated_at, created_at",
      )
      .eq("vendor_id", vendorId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("crm_pipeline_events")
      .select(
        "id, pipeline_id, vendor_id, from_stage, to_stage, metadata, created_at",
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const items = (pipelineRows ?? []) as CrmPipelineRow[];
  const events = (eventRows ?? []) as CrmPipelineEventRow[];

  const grouped = new Map<CrmStage, CrmPipelineRow[]>();
  (Object.keys(STAGE_LABELS) as CrmStage[]).forEach((stage) =>
    grouped.set(stage, []),
  );
  items.forEach((item) => {
    const list = grouped.get(item.stage) ?? [];
    list.push(item);
    grouped.set(item.stage, list);
  });

  const forecast = summarizeForecast(items);
  const analytics = computeCrmAnalytics(items, events);
  const notifications = buildCrmNotifications(items);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor CRM Dashboard</h1>
      <p className="text-lh-muted text-sm">Vendor: {vendorId}</p>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">AI Vendor Assistant</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(vendorId)}&prompt=${encodeURIComponent("Help me respond to this lead")}`}
            className="border-lh-border rounded border px-3 py-1"
          >
            Help me respond to this lead
          </Link>
          <Link
            href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(vendorId)}&prompt=${encodeURIComponent("Help me write a quote")}`}
            className="border-lh-border rounded border px-3 py-1"
          >
            Help me write a quote
          </Link>
          <Link
            href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(vendorId)}&prompt=${encodeURIComponent("Help me follow up")}`}
            className="border-lh-border rounded border px-3 py-1"
          >
            Help me follow up
          </Link>
          <Link
            href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(vendorId)}&prompt=${encodeURIComponent("Help me draft a negotiation reply")}`}
            className="border-lh-border rounded border px-3 py-1"
          >
            Draft negotiation reply
          </Link>
          <Link
            href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(vendorId)}&prompt=${encodeURIComponent("Help me draft a booking confirmation")}`}
            className="border-lh-border rounded border px-3 py-1"
          >
            Draft booking confirmation
          </Link>
          <Link
            href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(vendorId)}&prompt=${encodeURIComponent("Suggest the best time to follow up and tone")}`}
            className="border-lh-border rounded border px-3 py-1"
          >
            Best follow-up time/tone
          </Link>
          <Link
            href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(vendorId)}&prompt=${encodeURIComponent("Suggest a pricing strategy for this pipeline")}`}
            className="border-lh-border rounded border px-3 py-1"
          >
            Pricing strategy
          </Link>
          <Link
            href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(vendorId)}&prompt=${encodeURIComponent("Help me improve my response rate")}`}
            className="border-lh-border rounded border px-3 py-1"
          >
            Improve response rate
          </Link>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Projected Monthly Revenue</p>
          <p className="text-xl font-semibold">
            R{" "}
            {Math.round(forecast.projectedMonthlyRevenue).toLocaleString(
              "en-ZA",
            )}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Projected Weekly Revenue</p>
          <p className="text-xl font-semibold">
            R{" "}
            {Math.round(forecast.projectedWeeklyRevenue).toLocaleString(
              "en-ZA",
            )}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Pipeline Value</p>
          <p className="text-xl font-semibold">
            R {Math.round(forecast.pipelineValue).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Weighted Pipeline Value</p>
          <p className="text-xl font-semibold">
            R{" "}
            {Math.round(forecast.weightedPipelineValue).toLocaleString("en-ZA")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Conversion Rate</p>
          <p className="text-xl font-semibold">
            {(analytics.conversionRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Quote-to-Booking Rate</p>
          <p className="text-xl font-semibold">
            {(analytics.quoteToBookingRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Avg Negotiation Time</p>
          <p className="text-xl font-semibold">
            {analytics.averageNegotiationTimeHours.toFixed(1)}h
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Avg Lead Response Time</p>
          <p className="text-xl font-semibold">
            {analytics.averageLeadResponseTimeHours.toFixed(1)}h
          </p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">CRM Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-lh-muted text-sm">No CRM alerts right now.</p>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <p key={notification} className="text-sm">
                {notification}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Pipeline by Stage</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(STAGE_LABELS) as CrmStage[]).map((stage) => (
            <div key={stage} className="card space-y-1">
              <p className="font-medium">{STAGE_LABELS[stage]}</p>
              <p className="text-lh-muted text-sm">
                {grouped.get(stage)?.length ?? 0} item(s)
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Pipeline Kanban</h2>
        <CRMKanban vendorId={vendorId} initialItems={items} />
      </section>
    </section>
  );
}
