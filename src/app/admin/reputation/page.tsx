import { createServiceClient } from "@/lib/db";
import { getReputationTier } from "@/lib/reputation/tiers";
import AdminReputationActions from "@/components/reputation/AdminReputationActions";

export const dynamic = "force-dynamic";

export default async function AdminReputationPage() {
  const supabase = createServiceClient();

  const [{ data: rows }, { data: trustRows }] = await Promise.all([
    supabase
      .from("user_reputation")
      .select(
        "user_id, reputation_score, completed_bookings, cancelled_bookings, on_time_payments, late_payments, dispute_count, abusive_flags, updated_at",
      )
      .order("reputation_score", { ascending: true })
      .limit(5000),
    supabase
      .from("user_trust_profile")
      .select("user_id, bookings_locked")
      .limit(5000),
  ]);

  const lockByUser = new Map<string, boolean>(
    (trustRows ?? []).map((row) => [
      String(row.user_id),
      Boolean(row.bookings_locked),
    ]),
  );

  const highRisk = (rows ?? []).filter(
    (row) => Number(row.reputation_score ?? 50) <= 20,
  );
  const premium = (rows ?? []).filter(
    (row) => Number(row.reputation_score ?? 50) >= 81,
  );
  const repeatedCancellation = (rows ?? []).filter(
    (row) => Number(row.cancelled_bookings ?? 0) >= 3,
  );
  const abusive = (rows ?? []).filter(
    (row) => Number(row.abusive_flags ?? 0) > 0,
  );

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Reputation Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">High-risk users</p>
          <p className="text-xl font-semibold">{highRisk.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Premium users</p>
          <p className="text-xl font-semibold">{premium.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Repeated cancellations</p>
          <p className="text-xl font-semibold">{repeatedCancellation.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Abusive flags</p>
          <p className="text-xl font-semibold">{abusive.length}</p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Users</h2>
        {(rows ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No reputation data yet.</p>
        ) : (
          (rows ?? []).map((row) => (
            <article
              key={String(row.user_id)}
              className="border-lh-border space-y-2 rounded border p-3 text-sm"
            >
              <div className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
                <p>
                  <span className="font-medium">User:</span>{" "}
                  {String(row.user_id)}
                </p>
                <p>
                  <span className="font-medium">Score:</span>{" "}
                  {Number(row.reputation_score)}
                </p>
                <p>
                  <span className="font-medium">Tier:</span>{" "}
                  {getReputationTier(Number(row.reputation_score ?? 50))}
                </p>
                <p>
                  <span className="font-medium">Bookings lock:</span>{" "}
                  {lockByUser.get(String(row.user_id)) ? "Locked" : "Open"}
                </p>
                <p>
                  <span className="font-medium">Completed:</span>{" "}
                  {Number(row.completed_bookings ?? 0)}
                </p>
                <p>
                  <span className="font-medium">Cancelled:</span>{" "}
                  {Number(row.cancelled_bookings ?? 0)}
                </p>
                <p>
                  <span className="font-medium">Disputes:</span>{" "}
                  {Number(row.dispute_count ?? 0)}
                </p>
                <p>
                  <span className="font-medium">Abusive flags:</span>{" "}
                  {Number(row.abusive_flags ?? 0)}
                </p>
              </div>
              <AdminReputationActions userId={String(row.user_id)} />
            </article>
          ))
        )}
      </section>
    </section>
  );
}
