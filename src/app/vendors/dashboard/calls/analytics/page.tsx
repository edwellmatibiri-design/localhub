import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string };

type StaffPerf = {
  staffId: number;
  name: string;
  total: number;
  answered: number;
  missed: number;
  averageDuration: number;
};

export default async function VendorCallsAnalyticsPage({
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

  const { data: calls } = await supabase
    .from("call_logs")
    .select("id, staff_id, lead_id, status, duration")
    .eq("vendor_id", vendorId)
    .order("started_at", { ascending: false })
    .limit(5000);

  const totalCalls = (calls ?? []).length;
  const missedCalls = (calls ?? []).filter(
    (call) => call.status === "missed",
  ).length;
  const averageDuration =
    totalCalls > 0
      ? (calls ?? []).reduce(
          (sum, call) => sum + Number(call.duration ?? 0),
          0,
        ) / totalCalls
      : 0;
  const missedRate = totalCalls > 0 ? missedCalls / totalCalls : 0;

  const leadIds = Array.from(
    new Set(
      (calls ?? [])
        .map((call) => Number(call.lead_id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );
  const { data: leads } = leadIds.length
    ? await supabase.from("leads").select("id, booking_id").in("id", leadIds)
    : { data: [] as Array<{ id: number; booking_id: number | null }> };

  const leadHasBooking = new Map<number, boolean>(
    (leads ?? []).map((lead) => [
      Number(lead.id),
      Number.isFinite(Number(lead.booking_id)) && Number(lead.booking_id) > 0,
    ]),
  );

  const convertedCalls = (calls ?? []).filter((call) => {
    const leadId = Number(call.lead_id);
    return Number.isFinite(leadId) && leadHasBooking.get(leadId) === true;
  }).length;
  const conversionRate = totalCalls > 0 ? convertedCalls / totalCalls : 0;

  const staffIds = Array.from(
    new Set(
      (calls ?? [])
        .map((call) => Number(call.staff_id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );
  const { data: staffRows } = staffIds.length
    ? await supabase.from("staff").select("id, name").in("id", staffIds)
    : { data: [] as Array<{ id: number; name: string }> };

  const staffNameById = new Map<number, string>(
    (staffRows ?? []).map((staff) => [Number(staff.id), String(staff.name)]),
  );

  const staffPerfMap = new Map<number, StaffPerf>();
  for (const call of calls ?? []) {
    const staffId = Number(call.staff_id);
    if (!Number.isFinite(staffId) || staffId <= 0) continue;

    const current = staffPerfMap.get(staffId) ?? {
      staffId,
      name: staffNameById.get(staffId) ?? `Staff #${staffId}`,
      total: 0,
      answered: 0,
      missed: 0,
      averageDuration: 0,
    };

    current.total += 1;
    if (call.status === "answered") current.answered += 1;
    if (call.status === "missed") current.missed += 1;
    current.averageDuration += Number(call.duration ?? 0);

    staffPerfMap.set(staffId, current);
  }

  const staffPerformance = Array.from(staffPerfMap.values())
    .map((item) => ({
      ...item,
      averageDuration: item.total > 0 ? item.averageDuration / item.total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Call Analytics</h1>
      <p className="text-lh-muted text-sm">Vendor: {vendorId}</p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="card">
          <p className="text-lh-muted text-xs">Call volume</p>
          <p className="text-xl font-semibold">{totalCalls}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Missed call rate</p>
          <p className="text-xl font-semibold">
            {(missedRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Avg call duration</p>
          <p className="text-xl font-semibold">
            {averageDuration.toFixed(1)} sec
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Calls to bookings</p>
          <p className="text-xl font-semibold">
            {(conversionRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Converted calls</p>
          <p className="text-xl font-semibold">{convertedCalls}</p>
        </div>
      </div>

      <section className="card overflow-x-auto">
        <h2 className="mb-2 text-lg font-semibold">Staff Call Performance</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-lh-muted text-left">
              <th className="py-2 pr-3">Staff</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Answered</th>
              <th className="py-2 pr-3">Missed</th>
              <th className="py-2 pr-3">Avg duration</th>
            </tr>
          </thead>
          <tbody>
            {staffPerformance.map((row) => (
              <tr key={row.staffId} className="border-lh-border/60 border-t">
                <td className="py-2 pr-3">{row.name}</td>
                <td className="py-2 pr-3">{row.total}</td>
                <td className="py-2 pr-3">{row.answered}</td>
                <td className="py-2 pr-3">{row.missed}</td>
                <td className="py-2 pr-3">
                  {row.averageDuration.toFixed(1)} sec
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staffPerformance.length === 0 && (
          <p className="text-lh-muted text-sm">No staff call data yet.</p>
        )}
      </section>
    </section>
  );
}
