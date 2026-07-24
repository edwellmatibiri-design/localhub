"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import {
  StatementGenerateButton,
  TaxGenerateButton,
} from "@/components/financial/FinancialActions";

type StatementRow = {
  id: number;
  vendor_id: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_payouts: number;
  total_fees: number;
  net_earnings: number;
  tax_estimate: number;
};

export default function AdminFinancialPage() {
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: readError } = await supabase
        .from("financial_statements")
        .select(
          "id, vendor_id, period_start, period_end, total_revenue, total_payouts, total_fees, net_earnings, tax_estimate",
        )
        .order("period_start", { ascending: false })
        .limit(2000);

      if (readError) throw readError;
      setRows((data ?? []) as StatementRow[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load financial oversight",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    const totalVendorEarnings = rows.reduce(
      (sum, row) => sum + Number(row.net_earnings ?? 0),
      0,
    );
    const totalFeesCollected = rows.reduce(
      (sum, row) => sum + Number(row.total_fees ?? 0),
      0,
    );
    const totalPayouts = rows.reduce(
      (sum, row) => sum + Number(row.total_payouts ?? 0),
      0,
    );
    const taxEstimates = rows.reduce(
      (sum, row) => sum + Number(row.tax_estimate ?? 0),
      0,
    );

    return {
      totalVendorEarnings,
      totalFeesCollected,
      totalPayouts,
      taxEstimates,
    };
  }, [rows]);

  const vendors = useMemo(() => {
    const map = new Map<
      string,
      {
        revenue: number;
        fees: number;
        net: number;
        payouts: number;
        tax: number;
        statements: number;
      }
    >();
    rows.forEach((row) => {
      const key = String(row.vendor_id);
      const current = map.get(key) ?? {
        revenue: 0,
        fees: 0,
        net: 0,
        payouts: 0,
        tax: 0,
        statements: 0,
      };
      current.revenue += Number(row.total_revenue ?? 0);
      current.fees += Number(row.total_fees ?? 0);
      current.net += Number(row.net_earnings ?? 0);
      current.payouts += Number(row.total_payouts ?? 0);
      current.tax += Number(row.tax_estimate ?? 0);
      current.statements += 1;
      map.set(key, current);
    });
    return Array.from(map.entries());
  }, [rows]);

  const now = new Date();
  const currentStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
    .toISOString()
    .slice(0, 10);
  const currentEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  )
    .toISOString()
    .slice(0, 10);
  const currentYear = now.getUTCFullYear();

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Financial Oversight</h1>
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Total vendor earnings</p>
          <p className="text-xl font-semibold">
            R {totals.totalVendorEarnings.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Total fees collected</p>
          <p className="text-xl font-semibold">
            R {totals.totalFeesCollected.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Total payouts</p>
          <p className="text-xl font-semibold">
            R {totals.totalPayouts.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Tax estimates</p>
          <p className="text-xl font-semibold">
            R {totals.taxEstimates.toLocaleString("en-ZA")}
          </p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">
          Vendor-level Financial Summaries
        </h2>
        {vendors.length === 0 ? (
          <p className="text-lh-muted text-sm">
            No financial statement data yet.
          </p>
        ) : (
          vendors.map(([vendorId, row]) => (
            <article
              key={vendorId}
              className="border-lh-border space-y-2 rounded border p-3"
            >
              <p className="font-medium">{vendorId}</p>
              <div className="text-lh-muted grid gap-1 text-xs md:grid-cols-3 xl:grid-cols-6">
                <p>Revenue: R {row.revenue.toLocaleString("en-ZA")}</p>
                <p>Fees: R {row.fees.toLocaleString("en-ZA")}</p>
                <p>Net: R {row.net.toLocaleString("en-ZA")}</p>
                <p>Payouts: R {row.payouts.toLocaleString("en-ZA")}</p>
                <p>Tax est.: R {row.tax.toLocaleString("en-ZA")}</p>
                <p>Statements: {row.statements}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatementGenerateButton
                  vendorId={vendorId}
                  periodStart={currentStart}
                  periodEnd={currentEnd}
                  onDone={() => void load()}
                />
                <TaxGenerateButton
                  vendorId={vendorId}
                  year={currentYear}
                  onDone={() => void load()}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
