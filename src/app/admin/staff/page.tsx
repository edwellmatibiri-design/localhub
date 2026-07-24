import { createServiceClient } from "@/lib/db";
import { getStaffPerformance } from "@/lib/staff/performance";
import {
  DisableStaffButton,
  ResetPermissionsButton,
} from "@/components/staff/StaffAdminButtons";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const supabase = createServiceClient();

  const [{ data: staffRows }, { data: assignments }] = await Promise.all([
    supabase
      .from("staff")
      .select(
        "id, vendor_id, name, email, role, permissions, is_active, disabled_at, last_activity, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(800),
    supabase
      .from("job_assignments")
      .select("id, staff_id, booking_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const performanceRows = await Promise.all(
    (staffRows ?? []).map(async (row) => ({
      staffId: Number(row.id),
      performance: await getStaffPerformance(Number(row.id)),
    })),
  );
  const performanceByStaffId = new Map<
    number,
    (typeof performanceRows)[number]["performance"]
  >(performanceRows.map((row) => [row.staffId, row.performance]));

  const assignmentPatterns = new Map<
    number,
    { assigned: number; inProgress: number; completed: number }
  >();
  (assignments ?? []).forEach((assignment) => {
    const staffId = Number(assignment.staff_id);
    const existing = assignmentPatterns.get(staffId) ?? {
      assigned: 0,
      inProgress: 0,
      completed: 0,
    };
    if (assignment.status === "assigned") existing.assigned += 1;
    if (assignment.status === "in_progress") existing.inProgress += 1;
    if (assignment.status === "completed") existing.completed += 1;
    assignmentPatterns.set(staffId, existing);
  });

  const teamByVendor = new Map<string, number>();
  (staffRows ?? []).forEach((row) => {
    const vendorId = String(row.vendor_id);
    teamByVendor.set(vendorId, (teamByVendor.get(vendorId) ?? 0) + 1);
  });

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Staff Oversight</h1>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Vendor Team Structure</h2>
        {Array.from(teamByVendor.entries()).length === 0 ? (
          <p className="text-lh-muted text-sm">No team data found.</p>
        ) : (
          Array.from(teamByVendor.entries()).map(([vendorId, count]) => (
            <p key={vendorId} className="text-lh-muted text-sm">
              {vendorId}: {count} staff members
            </p>
          ))
        )}
      </section>

      <section className="space-y-3">
        {(staffRows ?? []).length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No staff records found.</p>
          </div>
        ) : (
          (staffRows ?? []).map((staff) => {
            const perf = performanceByStaffId.get(Number(staff.id));
            const pattern = assignmentPatterns.get(Number(staff.id)) ?? {
              assigned: 0,
              inProgress: 0,
              completed: 0,
            };
            return (
              <article key={staff.id} className="card space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{staff.name}</p>
                  <span className="text-lh-muted text-xs">
                    {staff.disabled_at ? "Disabled" : "Active"}
                  </span>
                </div>
                <p className="text-lh-muted text-sm">
                  Vendor: {staff.vendor_id}
                </p>
                <p className="text-lh-muted text-sm">Email: {staff.email}</p>
                <p className="text-lh-muted text-sm">Role: {staff.role}</p>
                <p className="text-lh-muted text-xs">
                  Permissions: {JSON.stringify(staff.permissions)}
                </p>

                <div className="text-lh-muted grid gap-2 text-xs md:grid-cols-4">
                  <p>Performance score: {perf?.staffPerformanceScore ?? 0}</p>
                  <p>Assigned jobs: {pattern.assigned}</p>
                  <p>In progress jobs: {pattern.inProgress}</p>
                  <p>Completed jobs: {pattern.completed}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <DisableStaffButton staffId={Number(staff.id)} />
                  <ResetPermissionsButton staffId={Number(staff.id)} />
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}
