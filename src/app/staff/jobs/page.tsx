import { createServiceClient } from "@/lib/db";
import {
  JobSheetOpenButton,
  JobStatusButton,
} from "@/components/staff/JobStatusButtons";

export const dynamic = "force-dynamic";

type SearchParams = { staffId?: string };

export default async function StaffJobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  const requestedStaffId = Number(params.staffId);
  const fallbackStaff = await supabase
    .from("staff")
    .select("id")
    .is("disabled_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const staffId =
    Number.isFinite(requestedStaffId) && requestedStaffId > 0
      ? requestedStaffId
      : Number(fallbackStaff.data?.id ?? 0);

  if (!Number.isFinite(staffId) || staffId <= 0) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-muted text-sm">No staff member selected.</p>
        </div>
      </section>
    );
  }

  const { data: assignments } = await supabase
    .from("job_assignments")
    .select(
      "id, booking_id, staff_id, assigned_by, status, job_sheet_document_id, started_at, completed_at, created_at",
    )
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false });

  const bookingIds = Array.from(
    new Set(
      (assignments ?? [])
        .map((row) => Number(row.booking_id))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  const { data: bookings } = bookingIds.length
    ? await supabase
        .from("bookings")
        .select("id, vendor_id, user_id, status, preferred_date")
        .in("id", bookingIds)
    : {
        data: [] as Array<{
          id: number;
          vendor_id: string;
          user_id: string;
          status: string;
          preferred_date: string | null;
        }>,
      };

  const bookingById = new Map<
    number,
    {
      id: number;
      vendor_id: string;
      user_id: string;
      status: string;
      preferred_date: string | null;
    }
  >((bookings ?? []).map((row) => [Number(row.id), row]));

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Staff Job Dashboard</h1>
      <p className="text-lh-muted text-sm">Staff ID: {staffId}</p>

      {(assignments ?? []).length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No assigned jobs.</p>
        </div>
      ) : (
        (assignments ?? []).map((assignment) => {
          const booking = bookingById.get(Number(assignment.booking_id));
          return (
            <article key={assignment.id} className="card space-y-2">
              <p className="font-medium">Assignment #{assignment.id}</p>
              <p className="text-lh-muted text-sm">
                Booking: {assignment.booking_id}
              </p>
              <p className="text-lh-muted text-sm">
                Assigned by: {assignment.assigned_by}
              </p>
              <p className="text-lh-muted text-sm">
                Status: {assignment.status}
              </p>
              <p className="text-lh-muted text-xs">
                Assigned:{" "}
                {new Date(String(assignment.created_at)).toLocaleString()}
              </p>
              {booking && (
                <div className="text-lh-muted grid gap-1 text-xs md:grid-cols-2">
                  <p>Vendor: {String(booking.vendor_id)}</p>
                  <p>User: {String(booking.user_id)}</p>
                  <p>Booking status: {String(booking.status)}</p>
                  <p>
                    Date:{" "}
                    {booking.preferred_date
                      ? new Date(
                          String(booking.preferred_date),
                        ).toLocaleString()
                      : "-"}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {Number(assignment.job_sheet_document_id) > 0 && (
                  <JobSheetOpenButton
                    documentId={Number(assignment.job_sheet_document_id)}
                  />
                )}
                <JobStatusButton
                  assignmentId={Number(assignment.id)}
                  status="in_progress"
                  label="Mark in progress"
                />
                <JobStatusButton
                  assignmentId={Number(assignment.id)}
                  status="completed"
                  label="Mark completed"
                />
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
