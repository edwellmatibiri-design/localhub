import Link from "next/link";
import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = {
  vendorId?: string;
  staffId?: string;
  userId?: string;
  from?: string;
  to?: string;
};

export default async function VendorCallsDashboardPage({
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

  const staffFilter = Number(params.staffId);
  const userFilter = String(params.userId ?? "").trim();
  const from = String(params.from ?? "").trim();
  const to = String(params.to ?? "").trim();

  let query = supabase
    .from("call_logs")
    .select(
      "id, vendor_id, staff_id, user_id, lead_id, direction, status, started_at, ended_at, duration, recording_url",
    )
    .eq("vendor_id", vendorId)
    .order("started_at", { ascending: false })
    .limit(500);

  if (Number.isFinite(staffFilter) && staffFilter > 0) {
    query = query.eq("staff_id", staffFilter);
  }
  if (userFilter) {
    query = query.eq("user_id", userFilter);
  }
  if (from) {
    query = query.gte("started_at", `${from}T00:00:00.000Z`);
  }
  if (to) {
    query = query.lte("started_at", `${to}T23:59:59.999Z`);
  }

  const [{ data: calls }, { data: staffRows }] = await Promise.all([
    query,
    supabase
      .from("staff")
      .select("id, name")
      .eq("vendor_id", vendorId)
      .is("disabled_at", null)
      .order("name", { ascending: true }),
  ]);

  const incoming = (calls ?? []).filter(
    (row) => row.direction === "incoming",
  ).length;
  const outgoing = (calls ?? []).filter(
    (row) => row.direction === "outgoing",
  ).length;
  const missed = (calls ?? []).filter((row) => row.status === "missed").length;
  const totalDuration = (calls ?? []).reduce(
    (sum, row) => sum + Number(row.duration ?? 0),
    0,
  );

  const staffById = new Map<number, string>(
    (staffRows ?? []).map((row) => [Number(row.id), String(row.name)]),
  );
  const users = Array.from(
    new Set((calls ?? []).map((row) => String(row.user_id)).filter(Boolean)),
  ).slice(0, 200);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Calls Dashboard</h1>
      <p className="text-lh-muted text-sm">Vendor: {vendorId}</p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Incoming calls</p>
          <p className="text-xl font-semibold">{incoming}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Outgoing calls</p>
          <p className="text-xl font-semibold">{outgoing}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Missed calls</p>
          <p className="text-xl font-semibold">{missed}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Call duration (sec)</p>
          <p className="text-xl font-semibold">{totalDuration}</p>
        </div>
      </div>

      <form
        className="card grid gap-2 md:grid-cols-2 xl:grid-cols-5"
        method="get"
      >
        <input type="hidden" name="vendorId" value={vendorId} />

        <label className="text-lh-muted text-xs">
          Staff
          <select
            name="staffId"
            defaultValue={
              Number.isFinite(staffFilter) && staffFilter > 0
                ? String(staffFilter)
                : ""
            }
            className="border-lh-border mt-1 w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">All staff</option>
            {(staffRows ?? []).map((staff) => (
              <option key={staff.id} value={staff.id}>
                {String(staff.name)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-lh-muted text-xs">
          User
          <select
            name="userId"
            defaultValue={userFilter}
            className="border-lh-border mt-1 w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">All users</option>
            {users.map((userId) => (
              <option key={userId} value={userId}>
                {userId}
              </option>
            ))}
          </select>
        </label>

        <label className="text-lh-muted text-xs">
          From
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="border-lh-border mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="text-lh-muted text-xs">
          To
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="border-lh-border mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="border-lh-border rounded border px-3 py-2 text-xs"
          >
            Apply filters
          </button>
        </div>
      </form>

      <section className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-lh-muted text-left">
              <th className="py-2 pr-3">Call</th>
              <th className="py-2 pr-3">Direction</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Staff</th>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Duration</th>
              <th className="py-2 pr-3">Recording</th>
              <th className="py-2 pr-3">Started</th>
            </tr>
          </thead>
          <tbody>
            {(calls ?? []).map((row) => (
              <tr key={row.id} className="border-lh-border/60 border-t">
                <td className="py-2 pr-3">
                  <Link
                    href={`/vendors/dashboard/calls/${row.id}?vendorId=${vendorId}`}
                    className="underline"
                  >
                    #{row.id}
                  </Link>
                </td>
                <td className="py-2 pr-3">{String(row.direction ?? "-")}</td>
                <td className="py-2 pr-3">{String(row.status ?? "-")}</td>
                <td className="py-2 pr-3">
                  {row.staff_id
                    ? (staffById.get(Number(row.staff_id)) ??
                      `#${row.staff_id}`)
                    : "-"}
                </td>
                <td className="py-2 pr-3">{String(row.user_id)}</td>
                <td className="py-2 pr-3">{Number(row.duration ?? 0)} sec</td>
                <td className="py-2 pr-3">
                  {row.recording_url ? (
                    <a
                      className="underline"
                      href={String(row.recording_url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-2 pr-3">
                  {new Date(String(row.started_at)).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(calls ?? []).length === 0 && (
          <p className="text-lh-muted text-sm">
            No calls found for the selected filters.
          </p>
        )}
      </section>
    </section>
  );
}
