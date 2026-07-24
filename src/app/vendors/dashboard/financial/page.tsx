import Chart from "@/components/Chart";
import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string };

export default async function VendorFinancialDashboard({
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

  const year = new Date().getUTCFullYear();
  const ytdStart = `${year}-01-01T00:00:00.000Z`;
  const ytdEnd = `${year}-12-31T23:59:59.999Z`;

  const [
    { data: payouts },
    { data: invoices },
    { data: boosts },
    { data: statements },
  ] = await Promise.all([
    supabase
      .from("payouts")
      .select("id, amount, status, created_at")
      .eq("vendor_id", vendorId)
      .eq("status", "paid")
      .gte("created_at", ytdStart)
      .lte("created_at", ytdEnd),
    supabase
      .from("invoices")
      .select("id, total, status, created_at")
      .eq("vendor_id", vendorId)
      .gte("created_at", ytdStart)
      .lte("created_at", ytdEnd),
    supabase
      .from("boosts")
      .select("id, amount, created_at")
      .eq("vendor_id", vendorId)
      .gte("created_at", ytdStart)
      .lte("created_at", ytdEnd),
    supabase
      .from("financial_statements")
      .select(
        "id, period_start, total_revenue, total_fees, net_earnings, total_payouts",
      )
      .eq("vendor_id", vendorId)
      .gte("period_start", `${year}-01-01`)
      .lte("period_end", `${year}-12-31`)
      .order("period_start", { ascending: true }),
  ]);

  const totalRevenue = (payouts ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const payoutsReceived = totalRevenue;
  const outstandingInvoices = (invoices ?? [])
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const boostFees = (boosts ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const commissionFees = Math.round(totalRevenue * 0.1);
  const feesPaid = boostFees + commissionFees;
  const netEarnings = totalRevenue - feesPaid;

  const monthlyRevenueData = (statements ?? []).map((row) => ({
    period: row.period_start,
    value: row.total_revenue,
  }));
  const payoutTimelineData = (statements ?? []).map((row) => ({
    period: row.period_start,
    value: row.total_payouts,
  }));
  const feeBreakdownData = [
    { label: "Boosts", value: boostFees },
    { label: "Commissions", value: commissionFees },
  ];
  const netTrendData = (statements ?? []).map((row) => ({
    period: row.period_start,
    value: row.net_earnings,
  }));

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Financial Hub</h1>
      <p className="text-lh-muted text-sm">Vendor: {vendorId}</p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="card">
          <p className="text-lh-muted text-xs">Total revenue (YTD)</p>
          <p className="text-xl font-semibold">
            R {totalRevenue.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Net earnings (YTD)</p>
          <p className="text-xl font-semibold">
            R {netEarnings.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Payouts received</p>
          <p className="text-xl font-semibold">
            R {payoutsReceived.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Outstanding invoices</p>
          <p className="text-xl font-semibold">
            R {outstandingInvoices.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">
            Fees paid (boosts + commissions)
          </p>
          <p className="text-xl font-semibold">
            R {feesPaid.toLocaleString("en-ZA")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Chart label="Monthly revenue" />
          <div className="card text-lh-muted space-y-1 text-xs">
            {monthlyRevenueData.length === 0 ? (
              <p>No monthly revenue data yet.</p>
            ) : (
              monthlyRevenueData.map((row) => (
                <p key={String(row.period)}>
                  Month {String(row.period)}: R{" "}
                  {Number(row.value).toLocaleString("en-ZA")}
                </p>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Chart label="Payout timeline" />
          <div className="card text-lh-muted space-y-1 text-xs">
            {payoutTimelineData.length === 0 ? (
              <p>No payout timeline data yet.</p>
            ) : (
              payoutTimelineData.map((row) => (
                <p key={String(row.period)}>
                  Month {String(row.period)}: R{" "}
                  {Number(row.value).toLocaleString("en-ZA")}
                </p>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Chart label="Fee breakdown" />
          <div className="card text-lh-muted space-y-1 text-xs">
            {feeBreakdownData.map((row) => (
              <p key={row.label}>
                {row.label}: R {row.value.toLocaleString("en-ZA")}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Chart label="Net earnings trend" />
          <div className="card text-lh-muted space-y-1 text-xs">
            {netTrendData.length === 0 ? (
              <p>No net earnings trend data yet.</p>
            ) : (
              netTrendData.map((row) => (
                <p key={String(row.period)}>
                  Month {String(row.period)}: R{" "}
                  {Number(row.value).toLocaleString("en-ZA")}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
