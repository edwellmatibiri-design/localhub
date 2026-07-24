import { createServiceClient } from "@/lib/db";
import { getReputationTier } from "@/lib/reputation/tiers";

export const dynamic = "force-dynamic";

type Params = { userId: string };

function badges(
  score: number,
  completedBookings: number,
  cancelledBookings: number,
  onTime: number,
  late: number,
) {
  const result: string[] = [];
  const tier = getReputationTier(score);
  if (tier === "Trusted" || tier === "Premium") result.push("Trusted User");
  if (tier === "Premium") result.push("Premium User");
  if (completedBookings >= 5 && cancelledBookings === 0)
    result.push("Reliable Booker");
  if (onTime > 0 && late === 0) result.push("Perfect Payment Record");
  return result;
}

export default async function VendorUserReputationView({
  params,
}: {
  params: Promise<Params>;
}) {
  const { userId } = await params;
  const supabase = createServiceClient();

  const [
    { data: reputation },
    { count: bookingCount },
    { count: cancelledCount },
    { count: disputeCount },
  ] = await Promise.all([
    supabase
      .from("user_reputation")
      .select(
        "reputation_score, positive_events, negative_events, completed_bookings, cancelled_bookings, on_time_payments, late_payments, dispute_count, abusive_flags",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "cancelled"),
    supabase
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const row = (reputation ?? {
    reputation_score: 50,
    positive_events: 0,
    negative_events: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    on_time_payments: 0,
    late_payments: 0,
    dispute_count: 0,
    abusive_flags: 0,
  }) as {
    reputation_score: number;
    positive_events: number;
    negative_events: number;
    completed_bookings: number;
    cancelled_bookings: number;
    on_time_payments: number;
    late_payments: number;
    dispute_count: number;
    abusive_flags: number;
  };

  const tier = getReputationTier(Number(row.reputation_score ?? 50));
  const userBadges = badges(
    Number(row.reputation_score ?? 50),
    Number(row.completed_bookings ?? 0),
    Number(row.cancelled_bookings ?? 0),
    Number(row.on_time_payments ?? 0),
    Number(row.late_payments ?? 0),
  );

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">User Reputation View</h1>
      <p className="text-lh-muted text-sm">User: {userId}</p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Reputation score</p>
          <p className="text-xl font-semibold">{row.reputation_score}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Tier</p>
          <p className="text-xl font-semibold">{tier}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Booking history</p>
          <p className="text-xl font-semibold">{Number(bookingCount ?? 0)}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Cancellation history</p>
          <p className="text-xl font-semibold">{Number(cancelledCount ?? 0)}</p>
        </div>
      </div>

      <section className="card grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
        <p>Dispute history: {Number(disputeCount ?? row.dispute_count ?? 0)}</p>
        <p>Payment on-time: {row.on_time_payments}</p>
        <p>Payment late: {row.late_payments}</p>
        <p>Abusive flags: {row.abusive_flags}</p>
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {userBadges.length === 0 ? (
            <p className="text-lh-muted text-sm">No badges.</p>
          ) : (
            userBadges.map((badge) => (
              <span key={badge} className="badge">
                {badge}
              </span>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
