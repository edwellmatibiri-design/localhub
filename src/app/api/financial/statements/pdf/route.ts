import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { renderSimplePdf } from "@/lib/business/pdf";
import { computeStatementMetrics } from "@/lib/financial/metrics";

type Body = {
  statementId?: number | string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const statementId = Number(body.statementId);
  if (!Number.isFinite(statementId) || statementId <= 0) {
    return NextResponse.json(
      { ok: false, error: "statementId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: statement, error } = await supabase
      .from("financial_statements")
      .select(
        "id, vendor_id, period_start, period_end, total_bookings, total_revenue, total_payouts, total_fees, net_earnings, tax_estimate",
      )
      .eq("id", statementId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    if (!statement) {
      return NextResponse.json(
        { ok: false, error: "Statement not found" },
        { status: 404 },
      );
    }

    const metrics = await computeStatementMetrics({
      vendorId: String(statement.vendor_id),
      periodStart: String(statement.period_start),
      periodEnd: String(statement.period_end),
    });

    const lines = [
      "LocalHub Financial Statement",
      `Statement ID: ${statement.id}`,
      `Vendor: ${statement.vendor_id}`,
      `Period: ${statement.period_start} to ${statement.period_end}`,
      "",
      "Summary",
      `Total bookings: ${statement.total_bookings}`,
      `Total revenue: R ${statement.total_revenue}`,
      `Total payouts: R ${statement.total_payouts}`,
      `Total fees: R ${statement.total_fees}`,
      `Net earnings: R ${statement.net_earnings}`,
      `Tax estimate: R ${statement.tax_estimate}`,
      "",
      "Breakdown - Bookings",
      ...metrics.breakdown.bookings
        .slice(0, 20)
        .map((booking) => `Booking #${booking.id}`),
      "",
      "Breakdown - Payouts",
      ...metrics.breakdown.payouts
        .slice(0, 20)
        .map(
          (payout) =>
            `Payout #${payout.id} | Booking ${payout.booking_id} | Amount R ${payout.amount}`,
        ),
      "",
      "Breakdown - Fees",
      `Commission: R ${metrics.breakdown.fees.commission}`,
      `Boosts: R ${metrics.breakdown.fees.boosts}`,
      `Invoice taxes: R ${metrics.breakdown.fees.invoices}`,
      ...metrics.breakdown.fees.boostRows
        .slice(0, 20)
        .map(
          (boost) => `Boost #${boost.id} | ${boost.type} | R ${boost.amount}`,
        ),
    ];

    const pdf = renderSimplePdf(lines);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"financial-statement-${statement.id}.pdf\"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to render statement PDF",
      },
      { status: 500 },
    );
  }
}
