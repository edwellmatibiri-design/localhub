import { createServiceClient } from "@/lib/db";
import { getVendorQualityData } from "@/lib/quality/scoring";

type SearchParams = {
  vendorId?: string;
};

export const dynamic = "force-dynamic";

export default async function VendorQualityPage({
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

  const [{ vendorQualityScore, signals }, { data: flags }] = await Promise.all([
    getVendorQualityData(vendorId),
    supabase
      .from("quality_flags")
      .select("id, type, severity, notes, created_at, resolved")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Quality Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <p className="text-lh-muted text-xs">Vendor Quality Score</p>
          <p className="text-2xl font-semibold">{vendorQualityScore}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Cancellation Rate</p>
          <p className="text-2xl font-semibold">
            {signals.cancellationRate.toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Response Time</p>
          <p className="text-2xl font-semibold">
            {signals.responseTimeAvgHours.toFixed(1)}h
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Disputes</p>
          <p className="text-2xl font-semibold">{signals.disputeCount}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Spam Flags</p>
          <p className="text-2xl font-semibold">{signals.spamFlagsCount}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Boost Fraud Flags</p>
          <p className="text-2xl font-semibold">
            {signals.boostFraudFlagsCount}
          </p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Suggested Improvements</h2>
        <ul className="text-lh-muted list-disc space-y-1 pl-5 text-sm">
          <li>Improve response time</li>
          <li>Reduce cancellations</li>
          <li>Resolve disputes quickly</li>
        </ul>
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Recent Flags</h2>
        {(flags ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No flags found.</p>
        ) : (
          <div className="space-y-2">
            {(flags ?? []).map((flag) => (
              <article
                key={flag.id}
                className="border-lh-border space-y-1 rounded-lg border p-3"
              >
                <p className="font-medium">{flag.type}</p>
                <p className="text-lh-muted text-xs">
                  Severity: {flag.severity}
                </p>
                <p className="text-lh-muted text-xs">
                  Status: {flag.resolved ? "Resolved" : "Open"}
                </p>
                <p className="text-lh-muted text-xs">{flag.notes ?? "-"}</p>
                <p className="text-lh-muted text-xs">
                  {new Date(flag.created_at).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
