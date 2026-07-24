import Link from "next/link";
import { createServiceClient } from "@/lib/db";
import {
  StatementGenerateButton,
  StatementPdfButton,
} from "@/components/financial/FinancialActions";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string };

export default async function VendorFinancialStatementsPage({
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

  const { data: statements } = await supabase
    .from("financial_statements")
    .select(
      "id, period_start, period_end, total_revenue, total_fees, net_earnings, tax_estimate",
    )
    .eq("vendor_id", vendorId)
    .order("period_start", { ascending: false });

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

  return (
    <section className="shell space-y-4 p-6">
      <div className="card flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Financial Statements</h1>
          <p className="text-lh-muted text-sm">Vendor: {vendorId}</p>
        </div>
        <StatementGenerateButton
          vendorId={vendorId}
          periodStart={currentStart}
          periodEnd={currentEnd}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-lh-muted text-left">
              <th className="py-2 pr-3">Period</th>
              <th className="py-2 pr-3">Revenue</th>
              <th className="py-2 pr-3">Fees</th>
              <th className="py-2 pr-3">Net earnings</th>
              <th className="py-2 pr-3">Tax estimate</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(statements ?? []).map((statement) => (
              <tr key={statement.id} className="border-lh-border/60 border-t">
                <td className="py-2 pr-3">
                  {String(statement.period_start)} to{" "}
                  {String(statement.period_end)}
                </td>
                <td className="py-2 pr-3">
                  R {Number(statement.total_revenue).toLocaleString("en-ZA")}
                </td>
                <td className="py-2 pr-3">
                  R {Number(statement.total_fees).toLocaleString("en-ZA")}
                </td>
                <td className="py-2 pr-3">
                  R {Number(statement.net_earnings).toLocaleString("en-ZA")}
                </td>
                <td className="py-2 pr-3">
                  R {Number(statement.tax_estimate).toLocaleString("en-ZA")}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/vendors/dashboard/financial/statements/${statement.id}`}
                      className="border-lh-border rounded border px-3 py-1 text-xs"
                    >
                      View statement
                    </Link>
                    <StatementPdfButton statementId={Number(statement.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(statements ?? []).length === 0 && (
          <p className="text-lh-muted text-sm">No statements generated yet.</p>
        )}
      </div>
    </section>
  );
}
