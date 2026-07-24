import Link from "next/link";
import { createServiceClient } from "@/lib/db";
import { CallBackButton } from "@/components/comms/CallDetailActions";

export const dynamic = "force-dynamic";

type SearchParams = { staffId?: string };

export default async function StaffCallsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  const requestedStaffId = Number(params.staffId);
  const fallback = await supabase
    .from("staff")
    .select("id")
    .is("disabled_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const staffId =
    Number.isFinite(requestedStaffId) && requestedStaffId > 0
      ? requestedStaffId
      : Number(fallback.data?.id ?? 0);

  if (!Number.isFinite(staffId) || staffId <= 0) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-muted text-sm">No staff member selected.</p>
        </div>
      </section>
    );
  }

  const { data: calls } = await supabase
    .from("call_logs")
    .select(
      "id, vendor_id, staff_id, user_id, lead_id, direction, status, started_at, duration",
    )
    .eq("staff_id", staffId)
    .order("started_at", { ascending: false })
    .limit(500);

  const missedCalls = (calls ?? []).filter((call) => call.status === "missed");

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Staff Calls Dashboard</h1>
      <p className="text-lh-muted text-sm">Staff ID: {staffId}</p>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Assigned Calls</h2>
        {(calls ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No assigned calls.</p>
        ) : (
          (calls ?? []).map((call) => (
            <article
              key={call.id}
              className="border-lh-border space-y-2 rounded border p-3 text-sm"
            >
              <div className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
                <p>
                  <span className="font-medium">Call:</span> #{call.id}
                </p>
                <p>
                  <span className="font-medium">Direction:</span>{" "}
                  {String(call.direction ?? "-")}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {String(call.status ?? "-")}
                </p>
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {Number(call.duration ?? 0)} sec
                </p>
              </div>
              <p className="text-lh-muted text-xs">
                Started: {new Date(String(call.started_at)).toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-2">
                <CallBackButton
                  vendorId={String(call.vendor_id)}
                  userId={String(call.user_id)}
                  staffId={staffId}
                  leadId={
                    Number.isFinite(Number(call.lead_id))
                      ? Number(call.lead_id)
                      : null
                  }
                />
                <Link
                  href={`/vendors/dashboard/calls/${call.id}?vendorId=${encodeURIComponent(String(call.vendor_id))}`}
                  className="border-lh-border rounded border px-3 py-1 text-xs"
                >
                  Open detail
                </Link>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Missed Calls</h2>
        {missedCalls.length === 0 ? (
          <p className="text-lh-muted text-sm">No missed calls.</p>
        ) : (
          missedCalls.map((call) => (
            <article
              key={call.id}
              className="border-lh-border rounded border p-3 text-sm"
            >
              <p className="font-medium">Call #{call.id}</p>
              <p className="text-lh-muted">User: {String(call.user_id)}</p>
              <p className="text-lh-muted">
                Started: {new Date(String(call.started_at)).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
