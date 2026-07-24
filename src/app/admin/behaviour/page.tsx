import { createServiceClient } from "@/lib/db";
import { calculateLeadQualityScore } from "@/lib/predictive/leadScore";

export const dynamic = "force-dynamic";

export default async function AdminBehaviourPage() {
  const supabase = createServiceClient();

  const [
    { data: behaviourRows },
    { data: trustRows },
    { data: reputationRows },
    { data: trustProfiles },
  ] = await Promise.all([
    supabase
      .from("user_behaviour")
      .select(
        "user_id, searches, leads_requested, leads_responded, bookings_started, bookings_completed, bookings_cancelled, messages_sent, messages_received, avg_response_time",
      )
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase
      .from("user_trust_profile")
      .select("user_id, trust_score, cancellation_rate")
      .limit(5000),
    supabase
      .from("user_reputation")
      .select("user_id, reputation_score")
      .limit(5000),
    supabase
      .from("user_trust_profile")
      .select("user_id, bookings_locked")
      .limit(5000),
  ]);

  const trustByUser = new Map<
    string,
    { trust_score: number; cancellation_rate: number }
  >(
    (trustRows ?? []).map((row) => [
      String(row.user_id),
      {
        trust_score: Number(row.trust_score ?? 50),
        cancellation_rate: Number(row.cancellation_rate ?? 0),
      },
    ]),
  );

  const reputationByUser = new Map<string, number>(
    (reputationRows ?? []).map((row) => [
      String(row.user_id),
      Number(row.reputation_score ?? 50),
    ]),
  );
  const lockByUser = new Map<string, boolean>(
    (trustProfiles ?? []).map((row) => [
      String(row.user_id),
      Boolean(row.bookings_locked),
    ]),
  );

  const users = (behaviourRows ?? []).map((row) => {
    const userId = String(row.user_id);
    const trust = trustByUser.get(userId);
    const trustScore = Number(trust?.trust_score ?? 50);
    const cancellationRate = Number(trust?.cancellation_rate ?? 0);
    const reputationScore = Number(reputationByUser.get(userId) ?? 50);

    const leadQualityScore = calculateLeadQualityScore({
      bookings_completed: Number(row.bookings_completed ?? 0),
      leads_responded: Number(row.leads_responded ?? 0),
      messages_sent: Number(row.messages_sent ?? 0),
      bookings_cancelled: Number(row.bookings_cancelled ?? 0),
      avg_response_time: Number(row.avg_response_time ?? 0),
      trust_score: trustScore,
      reputation_score: reputationScore,
      cancellation_rate: cancellationRate,
      response_time: Number(row.avg_response_time ?? 0),
    });

    const responseRate =
      Number(row.leads_requested ?? 0) > 0
        ? (Number(row.leads_responded ?? 0) / Number(row.leads_requested)) * 100
        : 0;

    return {
      userId,
      leadQualityScore,
      trustScore,
      reputationScore,
      cancellationRate,
      responseRate,
      avgResponseTime: Number(row.avg_response_time ?? 0),
      bookingsCancelled: Number(row.bookings_cancelled ?? 0),
      bookingsLocked: Boolean(lockByUser.get(userId)),
    };
  });

  const highRiskUsers = users.filter((u) => u.leadQualityScore < 20);
  const highQualityUsers = users.filter((u) => u.leadQualityScore >= 70);
  const lowResponseUsers = users.filter(
    (u) => u.responseRate > 0 && u.responseRate < 30,
  );
  const highCancellationUsers = users.filter(
    (u) => u.cancellationRate > 30 || u.bookingsCancelled >= 3,
  );

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Behaviour Intelligence</h1>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">High-risk users</p>
          <p className="text-xl font-semibold">{highRiskUsers.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">High-quality users</p>
          <p className="text-xl font-semibold">{highQualityUsers.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Low response users</p>
          <p className="text-xl font-semibold">{lowResponseUsers.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">High cancellation users</p>
          <p className="text-xl font-semibold">
            {highCancellationUsers.length}
          </p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">User Behaviour Scores</h2>
        {users.length === 0 ? (
          <p className="text-lh-muted text-sm">No behaviour data yet.</p>
        ) : (
          users.map((user) => (
            <article
              key={user.userId}
              className="border-lh-border grid gap-1 rounded border p-3 text-sm md:grid-cols-2 xl:grid-cols-4"
            >
              <p>
                <span className="font-medium">User:</span> {user.userId}
              </p>
              <p>
                <span className="font-medium">Lead quality:</span>{" "}
                {user.leadQualityScore}
              </p>
              <p>
                <span className="font-medium">Trust:</span> {user.trustScore}
              </p>
              <p>
                <span className="font-medium">Reputation:</span>{" "}
                {user.reputationScore}
              </p>
              <p>
                <span className="font-medium">Cancellation rate:</span>{" "}
                {user.cancellationRate}%
              </p>
              <p>
                <span className="font-medium">Response rate:</span>{" "}
                {user.responseRate.toFixed(1)}%
              </p>
              <p>
                <span className="font-medium">Avg response:</span>{" "}
                {user.avgResponseTime}s
              </p>
              <p>
                <span className="font-medium">Bookings lock:</span>{" "}
                {user.bookingsLocked ? "Locked" : "Open"}
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
