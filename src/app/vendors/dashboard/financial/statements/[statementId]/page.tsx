import { createServiceClient } from "@/lib/db";
import { computeStatementMetrics } from "@/lib/financial/metrics";
import { StatementPdfButton } from "@/components/financial/FinancialActions";

type Params = { statementId: string };

export const dynamic = "force-dynamic";

export default async function FinancialStatementDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { statementId: statementIdParam } = await params;
  const statementId = Number(statementIdParam);

  if (!Number.isFinite(statementId) || statementId <= 0) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-danger text-sm">Invalid statement ID.</p>
        </div>
      </section>
    );
  }

  const supabase = createServiceClient();
  const { data: statement, error } = await supabase
    .from("financial_statements")
    .select(
      "id, vendor_id, period_start, period_end, total_bookings, total_revenue, total_payouts, total_fees, net_earnings, tax_estimate",
    )
    .eq("id", statementId)
    .maybeSingle();

  if (error) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-danger text-sm">{error.message}</p>
        </div>
      </section>
    );
  }

  if (!statement) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-danger text-sm">Statement not found.</p>
        </div>
      </section>
    );
  }

  const metrics = await computeStatementMetrics({
    vendorId: String(statement.vendor_id),
    periodStart: String(statement.period_start),
    periodEnd: String(statement.period_end),
  });

  return (
    <section className="shell space-y-4 p-6">
      <div className="card flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Statement #{statement.id}</h1>
          <p className="text-lh-muted text-sm">
            Period: {String(statement.period_start)} to{" "}
            {String(statement.period_end)}
          </p>
        </div>
        <StatementPdfButton statementId={statementId} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Total bookings</p>
          <p className="text-xl font-semibold">
            {Number(statement.total_bookings)}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Total revenue</p>
          <p className="text-xl font-semibold">
            R {Number(statement.total_revenue).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Total payouts</p>
          <p className="text-xl font-semibold">
            R {Number(statement.total_payouts).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Total fees</p>
          <p className="text-xl font-semibold">
            R {Number(statement.total_fees).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Net earnings</p>
          <p className="text-xl font-semibold">
            R {Number(statement.net_earnings).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Tax estimate</p>
          <p className="text-xl font-semibold">
            R {Number(statement.tax_estimate).toLocaleString("en-ZA")}
          </p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Bookings list</h2>
        {metrics.breakdown.bookings.length === 0 ? (
          <p className="text-lh-muted text-sm">No bookings in this period.</p>
        ) : (
          metrics.breakdown.bookings.map((booking) => (
            <p key={booking.id} className="text-lh-muted text-sm">
              Booking #{booking.id}
            </p>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Payouts list</h2>
        {metrics.breakdown.payouts.length === 0 ? (
          <p className="text-lh-muted text-sm">No payouts in this period.</p>
        ) : (
          metrics.breakdown.payouts.map((payout) => (
            <p key={payout.id} className="text-lh-muted text-sm">
              Payout #{payout.id} | Booking {payout.booking_id} | Amount R{" "}
              {Number(payout.amount).toLocaleString("en-ZA")}
            </p>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Fees list</h2>
        <p className="text-lh-muted text-sm">
          Commission: R{" "}
          {metrics.breakdown.fees.commission.toLocaleString("en-ZA")}
        </p>
        <p className="text-lh-muted text-sm">
          Invoice tax fees: R{" "}
          {metrics.breakdown.fees.invoices.toLocaleString("en-ZA")}
        </p>
        <p className="text-lh-muted text-sm">
          Boost fees: R {metrics.breakdown.fees.boosts.toLocaleString("en-ZA")}
        </p>
        {metrics.breakdown.fees.boostRows.map((boost) => (
          <p key={boost.id} className="text-lh-muted text-xs">
            Boost #{boost.id} | {String(boost.type)} | R{" "}
            {Number(boost.amount).toLocaleString("en-ZA")}
          </p>
        ))}
      </section>
    </section>
  );
}
