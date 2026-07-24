import { sb } from "@/lib/supabase/serverClient";
import type { HealthMetrics } from "./models";

export async function runHealthChecks(
  options: { shallow?: boolean } = {},
): Promise<HealthMetrics> {
  let bookingQuery = sb()
    .from("system_logs")
    .select("status, created_at")
    .eq("type", "booking");
  let payoutQuery = sb()
    .from("system_logs")
    .select("status, created_at")
    .eq("type", "payout");
  let errorQuery = sb().from("system_logs").select("level, created_at");

  if (options.shallow) {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    bookingQuery = bookingQuery.gte("created_at", oneHourAgo);
    payoutQuery = payoutQuery.gte("created_at", oneHourAgo);
    errorQuery = errorQuery.gte("created_at", oneHourAgo);
  }

  const [{ data: bookingLogs }, { data: payoutLogs }, { data: errorLogs }] =
    await Promise.all([bookingQuery, payoutQuery, errorQuery]);

  const bookings = bookingLogs ?? [];
  const payouts = payoutLogs ?? [];
  const errors = errorLogs ?? [];

  const bookingSuccess = bookings.filter(
    (row) => String(row.status ?? "").toLowerCase() === "success",
  ).length;
  const payoutSuccess = payouts.filter(
    (row) => String(row.status ?? "").toLowerCase() === "success",
  ).length;
  const errorCount = errors.filter(
    (row) => String(row.level ?? "").toLowerCase() === "error",
  ).length;

  const bookingSuccessRate = bookings.length
    ? bookingSuccess / bookings.length
    : 1;
  const payoutSuccessRate = payouts.length ? payoutSuccess / payouts.length : 1;
  const denominator = bookings.length + payouts.length;
  const errorRate = denominator > 0 ? errorCount / denominator : 0;

  return {
    bookingSuccessRate,
    payoutSuccessRate,
    errorRate,
    status:
      errorRate > 0.05 || payoutSuccessRate < 0.9 ? "degraded" : "healthy",
  };
}
