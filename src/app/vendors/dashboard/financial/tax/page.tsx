import { createServiceClient } from "@/lib/db";
import {
  TaxGenerateButton,
  TaxReportDownloadButton,
} from "@/components/financial/FinancialActions";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string };

export default async function VendorTaxPage({
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

  const currentYear = new Date().getUTCFullYear();

  const [{ data: yearStatements }, { data: taxReports }] = await Promise.all([
    supabase
      .from("financial_statements")
      .select("net_earnings")
      .eq("vendor_id", vendorId)
      .gte("period_start", `${currentYear}-01-01`)
      .lte("period_end", `${currentYear}-12-31`),
    supabase
      .from("tax_reports")
      .select("id, vendor_id, year, total_earnings, tax_estimate, created_at")
      .eq("vendor_id", vendorId)
      .order("year", { ascending: false }),
  ]);

  const yearlyEarnings = (yearStatements ?? []).reduce(
    (sum, row) => sum + Number(row.net_earnings ?? 0),
    0,
  );
  const taxEstimate = Math.round(yearlyEarnings * 0.15);

  return (
    <section className="shell space-y-4 p-6">
      <div className="card flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Vendor Tax Reports</h1>
          <p className="text-lh-muted text-sm">Vendor: {vendorId}</p>
        </div>
        <TaxGenerateButton vendorId={vendorId} year={currentYear} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="card">
          <p className="text-lh-muted text-xs">
            Yearly earnings ({currentYear})
          </p>
          <p className="text-xl font-semibold">
            R {yearlyEarnings.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Tax estimate ({currentYear})</p>
          <p className="text-xl font-semibold">
            R {taxEstimate.toLocaleString("en-ZA")}
          </p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Downloadable Tax Reports</h2>
        {(taxReports ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No tax reports generated yet.</p>
        ) : (
          (taxReports ?? []).map((report) => (
            <article
              key={report.id}
              className="border-lh-border flex flex-wrap items-center justify-between gap-2 rounded border p-3"
            >
              <div>
                <p className="font-medium">Tax Year {report.year}</p>
                <p className="text-lh-muted text-xs">
                  Earnings: R{" "}
                  {Number(report.total_earnings).toLocaleString("en-ZA")}
                </p>
                <p className="text-lh-muted text-xs">
                  Tax estimate: R{" "}
                  {Number(report.tax_estimate).toLocaleString("en-ZA")}
                </p>
              </div>
              <TaxReportDownloadButton
                report={{
                  id: Number(report.id),
                  vendor_id: String(report.vendor_id),
                  year: Number(report.year),
                  total_earnings: Number(report.total_earnings),
                  tax_estimate: Number(report.tax_estimate),
                  created_at: String(report.created_at),
                }}
              />
            </article>
          ))
        )}
      </section>
    </section>
  );
}
