import { createServiceClient } from "@/lib/db";

type StaffPerformance = {
  staffId: number;
  jobsCompleted: number;
  averageCompletionTimeHours: number;
  cancellationInvolvement: number;
  disputeInvolvement: number;
  reliability: number;
  staffPerformanceScore: number;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function getStaffPerformance(
  staffId: number,
): Promise<StaffPerformance> {
  const supabase = createServiceClient();

  const { data: assignments, error: assignmentsError } = await supabase
    .from("job_assignments")
    .select("id, booking_id, status, created_at, started_at, completed_at")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false });

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const rows = assignments ?? [];
  const jobsCompleted = rows.filter((row) => row.status === "completed").length;

  const completionHours = rows
    .filter((row) => row.status === "completed" && row.completed_at)
    .map((row) => {
      const startedAt = Date.parse(String(row.started_at ?? row.created_at));
      const completedAt = Date.parse(String(row.completed_at));
      return Math.max(0, (completedAt - startedAt) / (1000 * 60 * 60));
    })
    .filter((hours) => Number.isFinite(hours));

  const averageCompletionTimeHours = average(completionHours);

  const bookingIds = Array.from(
    new Set(
      rows
        .map((row) => Number(row.booking_id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  let cancellationInvolvement = 0;
  let disputeInvolvement = 0;

  if (bookingIds.length > 0) {
    const [{ data: bookings }, { data: disputes }] = await Promise.all([
      supabase.from("bookings").select("id, status").in("id", bookingIds),
      supabase
        .from("disputes")
        .select("id, booking_id")
        .in("booking_id", bookingIds),
    ]);

    cancellationInvolvement = (bookings ?? []).filter((booking) => {
      const status = String(booking.status ?? "");
      return status === "cancelled" || status === "refunded";
    }).length;

    disputeInvolvement = (disputes ?? []).length;
  }

  const completionSpeedScore = Math.max(
    0,
    100 - Math.round(averageCompletionTimeHours * 4),
  );
  const cancellationPenalty = cancellationInvolvement * 8;
  const disputePenalty = disputeInvolvement * 6;
  const throughputBonus = Math.min(25, jobsCompleted * 2);

  const staffPerformanceScore = Math.max(
    0,
    Math.min(
      100,
      completionSpeedScore +
        throughputBonus -
        cancellationPenalty -
        disputePenalty,
    ),
  );

  return {
    staffId,
    jobsCompleted,
    averageCompletionTimeHours,
    cancellationInvolvement,
    disputeInvolvement,
    reliability: Math.max(0, 100 - cancellationPenalty - disputePenalty),
    staffPerformanceScore,
  };
}

export async function getVendorStaffPerformance(vendorId: string) {
  const supabase = createServiceClient();
  const { data: staffRows, error } = await supabase
    .from("staff")
    .select("id, name, role, vendor_id")
    .eq("vendor_id", vendorId)
    .is("disabled_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const entries = await Promise.all(
    (staffRows ?? []).map(async (row) => ({
      staffId: Number(row.id),
      name: String(row.name ?? "Staff"),
      role: String(row.role ?? "worker"),
      performance: await getStaffPerformance(Number(row.id)),
    })),
  );

  return entries.sort(
    (a, b) =>
      b.performance.staffPerformanceScore - a.performance.staffPerformanceScore,
  );
}
