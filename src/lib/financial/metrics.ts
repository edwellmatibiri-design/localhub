import { createServiceClient } from "@/lib/db";

export type FinancialPeriod = {
  vendorId: string;
  periodStart: string;
  periodEnd: string;
};

function toIsoDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function periodBounds(periodStart: string, periodEnd: string) {
  const start = new Date(`${toIsoDate(periodStart)}T00:00:00.000Z`);
  const end = new Date(`${toIsoDate(periodEnd)}T23:59:59.999Z`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function computeStatementMetrics(input: FinancialPeriod) {
  const vendorId = String(input.vendorId ?? "").trim();
  if (!vendorId) throw new Error("vendorId is required");

  const supabase = createServiceClient();
  const bounds = periodBounds(input.periodStart, input.periodEnd);

  const [
    { data: bookings },
    { data: payouts },
    { data: boosts },
    { data: paidInvoices },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id")
      .eq("vendor_id", vendorId)
      .gte("created_at", bounds.start)
      .lte("created_at", bounds.end),
    supabase
      .from("payouts")
      .select("id, amount, booking_id, status, created_at")
      .eq("vendor_id", vendorId)
      .eq("status", "paid")
      .gte("created_at", bounds.start)
      .lte("created_at", bounds.end),
    supabase
      .from("boosts")
      .select("id, amount, type, target, created_at")
      .eq("vendor_id", vendorId)
      .gte("created_at", bounds.start)
      .lte("created_at", bounds.end),
    supabase
      .from("invoices")
      .select("id, total, tax, status, updated_at")
      .eq("vendor_id", vendorId)
      .eq("status", "paid")
      .gte("updated_at", bounds.start)
      .lte("updated_at", bounds.end),
  ]);

  const totalBookings = (bookings ?? []).length;
  const totalPayouts = (payouts ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const totalRevenue = totalPayouts;
  const commissionFees = Math.round(totalRevenue * 0.1);
  const boostFees = (boosts ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const invoiceFees = (paidInvoices ?? []).reduce(
    (sum, row) => sum + Number(row.tax ?? 0),
    0,
  );
  const totalFees = commissionFees + boostFees;
  const netEarnings = totalRevenue - totalFees;
  const taxEstimate = Math.round(netEarnings * 0.15);

  return {
    periodStart: toIsoDate(input.periodStart),
    periodEnd: toIsoDate(input.periodEnd),
    totalBookings,
    totalRevenue,
    totalPayouts,
    totalFees,
    netEarnings,
    taxEstimate,
    breakdown: {
      bookings: bookings ?? [],
      payouts: payouts ?? [],
      fees: {
        commission: commissionFees,
        boosts: boostFees,
        invoices: invoiceFees,
        boostRows: boosts ?? [],
      },
    },
  };
}

export async function upsertFinancialStatement(input: FinancialPeriod) {
  const vendorId = String(input.vendorId ?? "").trim();
  const metrics = await computeStatementMetrics(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("financial_statements")
    .upsert(
      {
        vendor_id: vendorId,
        period_start: metrics.periodStart,
        period_end: metrics.periodEnd,
        total_bookings: metrics.totalBookings,
        total_revenue: metrics.totalRevenue,
        total_payouts: metrics.totalPayouts,
        total_fees: metrics.totalFees,
        net_earnings: metrics.netEarnings,
        tax_estimate: metrics.taxEstimate,
      },
      { onConflict: "vendor_id,period_start,period_end" },
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return {
    statementId: Number(data.id),
    metrics,
  };
}

export async function regenerateCurrentMonthStatement(vendorId: string) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  );

  return upsertFinancialStatement({
    vendorId,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  });
}

export async function applyInvoicePaidToCurrentPeriod(
  vendorId: string,
  invoiceTotal: number,
  invoiceFee: number,
) {
  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
    .toISOString()
    .slice(0, 10);
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  )
    .toISOString()
    .slice(0, 10);

  const base = await upsertFinancialStatement({
    vendorId,
    periodStart,
    periodEnd,
  });

  const supabase = createServiceClient();
  const currentRevenue = Number(base.metrics.totalRevenue ?? 0);
  const currentFees = Number(base.metrics.totalFees ?? 0);

  const totalRevenue = currentRevenue + Math.max(0, Math.round(invoiceTotal));
  const totalFees = currentFees + Math.max(0, Math.round(invoiceFee));
  const netEarnings = totalRevenue - totalFees;
  const taxEstimate = Math.round(netEarnings * 0.15);

  const { error } = await supabase
    .from("financial_statements")
    .update({
      total_revenue: totalRevenue,
      total_fees: totalFees,
      net_earnings: netEarnings,
      tax_estimate: taxEstimate,
    })
    .eq("id", base.statementId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function generateTaxReport(vendorId: string, year: number) {
  const safeYear = Math.max(2000, Math.min(3000, Math.round(year)));
  const start = `${safeYear}-01-01`;
  const end = `${safeYear}-12-31`;

  const supabase = createServiceClient();
  const { data: statements, error: statementsError } = await supabase
    .from("financial_statements")
    .select("id, net_earnings")
    .eq("vendor_id", vendorId)
    .gte("period_start", start)
    .lte("period_end", end);

  if (statementsError) throw new Error(statementsError.message);

  const totalEarnings = (statements ?? []).reduce(
    (sum, row) => sum + Number(row.net_earnings ?? 0),
    0,
  );
  const taxEstimate = Math.round(totalEarnings * 0.15);

  const { data, error } = await supabase
    .from("tax_reports")
    .upsert(
      {
        vendor_id: vendorId,
        year: safeYear,
        total_earnings: totalEarnings,
        tax_estimate: taxEstimate,
      },
      { onConflict: "vendor_id,year" },
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return {
    taxReportId: Number(data.id),
    totalEarnings,
    taxEstimate,
  };
}
