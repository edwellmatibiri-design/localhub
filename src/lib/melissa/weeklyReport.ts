import { sb } from "@/lib/supabase/serverClient";

export async function generateWeeklyOpsReport() {
  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [{ data: tickets }, { data: logs }, { data: melissaActions }] =
    await Promise.all([
      sb()
        .from("support_tickets")
        .select("id, severity, created_at")
        .gte("created_at", weekAgo),
      sb()
        .from("system_logs")
        .select("type, status, level, created_at")
        .gte("created_at", weekAgo),
      sb()
        .from("melissa_actions")
        .select("id, created_at")
        .gte("created_at", weekAgo),
    ]);

  const ticketsRows = tickets ?? [];
  const logsRows = logs ?? [];
  const actionsRows = melissaActions ?? [];

  const totalTickets = ticketsRows.length;
  const highPriorityTickets = ticketsRows.filter(
    (t) => t.severity === "high",
  ).length;

  const bookingLogs = logsRows.filter((l) => l.type === "booking");
  const payoutLogs = logsRows.filter((l) => l.type === "payout");
  const errorLogs = logsRows.filter(
    (l) => l.type === "error" || l.level === "error",
  );

  const bookingSuccessRate =
    bookingLogs.filter((l) => l.status === "success").length /
    Math.max(bookingLogs.length, 1);
  const payoutSuccessRate =
    payoutLogs.filter((l) => l.status === "success").length /
    Math.max(payoutLogs.length, 1);
  const errorCount = errorLogs.length;

  const report = {
    period_start: weekAgo,
    period_end: now.toISOString(),
    totalTickets,
    highPriorityTickets,
    bookingSuccessRate,
    payoutSuccessRate,
    errorCount,
    melissaActionsCount: actionsRows.length,
  };

  await sb()
    .from("melissa_reports")
    .insert({
      type: "weekly_ops",
      payload: report,
      headline: "Weekly Ops Summary",
      highlights: [
        `Tickets: ${totalTickets} (high: ${highPriorityTickets})`,
        `Booking success: ${(bookingSuccessRate * 100).toFixed(1)}%`,
        `Payout success: ${(payoutSuccessRate * 100).toFixed(1)}%`,
        `Errors: ${errorCount}`,
        `Melissa actions: ${actionsRows.length}`,
      ],
      created_at: now.toISOString(),
    });

  return report;
}
