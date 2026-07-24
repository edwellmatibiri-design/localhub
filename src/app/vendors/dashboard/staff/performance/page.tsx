import { createServiceClient } from "@/lib/db";
import { getVendorStaffPerformance } from "@/lib/staff/performance";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string };

export default async function StaffPerformancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  const requestedVendorId = String(params.vendorId ?? "").trim();
  const fallbackVendor = await supabase
    .from("seller_profiles")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const vendorId = requestedVendorId || String(fallbackVendor.data?.id ?? "");

  if (!vendorId) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-muted text-sm">No vendor selected.</p>
        </div>
      </section>
    );
  }

  const entries = await getVendorStaffPerformance(vendorId);
  const topThreshold = entries.length
    ? entries[0].performance.staffPerformanceScore
    : 0;

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Staff Performance</h1>
      <p className="text-lh-muted text-sm">Vendor: {vendorId}</p>

      {entries.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">
            No staff performance data available.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const topPerformer =
              entry.performance.staffPerformanceScore >= topThreshold &&
              entry.performance.staffPerformanceScore >= 80;
            return (
              <article
                key={entry.staffId}
                className={`card space-y-2 ${topPerformer ? "border-lh-accent border-l-4" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{entry.name}</p>
                  {topPerformer && <span className="badge">Top performer</span>}
                </div>

                <p className="text-lh-muted text-sm">Role: {entry.role}</p>
                <div className="text-lh-muted grid gap-2 text-sm md:grid-cols-4">
                  <p>
                    Performance score: {entry.performance.staffPerformanceScore}
                  </p>
                  <p>Jobs completed: {entry.performance.jobsCompleted}</p>
                  <p>
                    Average time:{" "}
                    {entry.performance.averageCompletionTimeHours.toFixed(1)}h
                  </p>
                  <p>Reliability: {entry.performance.reliability}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
