import Link from "next/link";
import { createServiceClient } from "@/lib/db";
import AdminCommsActionButton from "@/components/comms/AdminCommsActions";

export const dynamic = "force-dynamic";

type VendorPerf = {
  vendorId: string;
  total: number;
  missed: number;
  averageDuration: number;
};

type StaffPerf = {
  staffId: number;
  name: string;
  total: number;
  missed: number;
  averageDuration: number;
};

export default async function AdminCommsPage() {
  const supabase = createServiceClient();

  const [{ data: calls }, { data: vendors }, { data: staffRows }] =
    await Promise.all([
      supabase
        .from("call_logs")
        .select(
          "id, vendor_id, staff_id, status, duration, recording_url, started_at",
        )
        .order("started_at", { ascending: false })
        .limit(5000),
      supabase
        .from("seller_profiles")
        .select("id, business_name, calling_disabled")
        .limit(2000),
      supabase.from("staff").select("id, name").limit(5000),
    ]);

  const totalCalls = (calls ?? []).length;
  const missedCalls = (calls ?? []).filter(
    (call) => call.status === "missed",
  ).length;

  const vendorPerfMap = new Map<string, VendorPerf>();
  for (const call of calls ?? []) {
    const vendorId = String(call.vendor_id ?? "").trim();
    if (!vendorId) continue;
    const current = vendorPerfMap.get(vendorId) ?? {
      vendorId,
      total: 0,
      missed: 0,
      averageDuration: 0,
    };
    current.total += 1;
    if (call.status === "missed") current.missed += 1;
    current.averageDuration += Number(call.duration ?? 0);
    vendorPerfMap.set(vendorId, current);
  }
  const vendorPerformance = Array.from(vendorPerfMap.values())
    .map((row) => ({
      ...row,
      averageDuration: row.total > 0 ? row.averageDuration / row.total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const staffNameById = new Map<number, string>(
    (staffRows ?? []).map((row) => [Number(row.id), String(row.name)]),
  );

  const staffPerfMap = new Map<number, StaffPerf>();
  for (const call of calls ?? []) {
    const staffId = Number(call.staff_id);
    if (!Number.isFinite(staffId) || staffId <= 0) continue;

    const current = staffPerfMap.get(staffId) ?? {
      staffId,
      name: staffNameById.get(staffId) ?? `Staff #${staffId}`,
      total: 0,
      missed: 0,
      averageDuration: 0,
    };

    current.total += 1;
    if (call.status === "missed") current.missed += 1;
    current.averageDuration += Number(call.duration ?? 0);

    staffPerfMap.set(staffId, current);
  }

  const staffPerformance = Array.from(staffPerfMap.values())
    .map((row) => ({
      ...row,
      averageDuration: row.total > 0 ? row.averageDuration / row.total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const vendorById = new Map<
    string,
    { id: string; business_name: string | null; calling_disabled: boolean }
  >(
    (vendors ?? []).map((vendor) => [
      String(vendor.id),
      {
        id: String(vendor.id),
        business_name: vendor.business_name
          ? String(vendor.business_name)
          : null,
        calling_disabled: Boolean(vendor.calling_disabled),
      },
    ]),
  );

  const recentRecordings = (calls ?? [])
    .filter((call) => Boolean(call.recording_url))
    .slice(0, 50);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Communications Oversight</h1>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Total calls</p>
          <p className="text-xl font-semibold">{totalCalls}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Missed calls</p>
          <p className="text-xl font-semibold">{missedCalls}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Vendors with calls</p>
          <p className="text-xl font-semibold">{vendorPerformance.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Staff with calls</p>
          <p className="text-xl font-semibold">{staffPerformance.length}</p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Vendor Call Performance</h2>
        {vendorPerformance.length === 0 ? (
          <p className="text-lh-muted text-sm">No vendor call data.</p>
        ) : (
          vendorPerformance.slice(0, 100).map((row) => {
            const vendor = vendorById.get(row.vendorId);
            return (
              <article
                key={row.vendorId}
                className="border-lh-border space-y-2 rounded border p-3 text-sm"
              >
                <p className="font-medium">
                  {vendor?.business_name ?? "Vendor"} ({row.vendorId})
                </p>
                <div className="text-lh-muted grid gap-1 md:grid-cols-3">
                  <p>Total: {row.total}</p>
                  <p>Missed: {row.missed}</p>
                  <p>Avg duration: {row.averageDuration.toFixed(1)} sec</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vendor?.calling_disabled ? (
                    <AdminCommsActionButton
                      label="Enable vendor calling"
                      action="enable_vendor_calling"
                      vendorId={row.vendorId}
                    />
                  ) : (
                    <AdminCommsActionButton
                      label="Disable vendor calling"
                      action="disable_vendor_calling"
                      vendorId={row.vendorId}
                    />
                  )}
                  <Link
                    href={`/vendors/dashboard/calls?vendorId=${encodeURIComponent(row.vendorId)}`}
                    className="border-lh-border rounded border px-3 py-1 text-xs"
                  >
                    Review call logs
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-2 text-lg font-semibold">Staff Call Performance</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-lh-muted text-left">
              <th className="py-2 pr-3">Staff</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Missed</th>
              <th className="py-2 pr-3">Avg duration</th>
            </tr>
          </thead>
          <tbody>
            {staffPerformance.map((row) => (
              <tr key={row.staffId} className="border-lh-border/60 border-t">
                <td className="py-2 pr-3">{row.name}</td>
                <td className="py-2 pr-3">{row.total}</td>
                <td className="py-2 pr-3">{row.missed}</td>
                <td className="py-2 pr-3">
                  {row.averageDuration.toFixed(1)} sec
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staffPerformance.length === 0 && (
          <p className="text-lh-muted text-sm">No staff call data.</p>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Recordings Review</h2>
        {recentRecordings.length === 0 ? (
          <p className="text-lh-muted text-sm">No recordings found.</p>
        ) : (
          recentRecordings.map((call) => (
            <article
              key={call.id}
              className="border-lh-border flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
            >
              <div>
                <p className="font-medium">Call #{call.id}</p>
                <p className="text-lh-muted">
                  Vendor: {String(call.vendor_id)}
                </p>
                <p className="text-lh-muted">
                  Started: {new Date(String(call.started_at)).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  className="border-lh-border rounded border px-3 py-1 text-xs"
                  href={String(call.recording_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open recording
                </a>
                <AdminCommsActionButton
                  label="Remove recording"
                  action="remove_recording"
                  callId={Number(call.id)}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
