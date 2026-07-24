"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import { getReputationTier } from "@/lib/reputation/tiers";

type ReputationRow = {
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

function buildBadges(row: ReputationRow) {
  const badges: string[] = [];
  const tier = getReputationTier(Number(row.reputation_score ?? 50));
  if (tier === "Trusted" || tier === "Premium") badges.push("Trusted User");
  if (tier === "Premium") badges.push("Premium User");
  if (
    Number(row.completed_bookings ?? 0) >= 5 &&
    Number(row.cancelled_bookings ?? 0) === 0
  )
    badges.push("Reliable Booker");
  if (
    Number(row.on_time_payments ?? 0) > 0 &&
    Number(row.late_payments ?? 0) === 0
  )
    badges.push("Perfect Payment Record");
  return badges;
}

export default function AccountReputationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ReputationRow | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const userId = String(auth?.user?.id ?? "");
        if (!userId) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("user_reputation")
          .select(
            "reputation_score, positive_events, negative_events, completed_bookings, cancelled_bookings, on_time_payments, late_payments, dispute_count, abusive_flags",
          )
          .eq("user_id", userId)
          .maybeSingle();

        setRow(
          (data ?? {
            reputation_score: 50,
            positive_events: 0,
            negative_events: 0,
            completed_bookings: 0,
            cancelled_bookings: 0,
            on_time_payments: 0,
            late_payments: 0,
            dispute_count: 0,
            abusive_flags: 0,
          }) as ReputationRow,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load reputation",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const tier = useMemo(
    () => getReputationTier(Number(row?.reputation_score ?? 50)),
    [row],
  );
  const badges = useMemo(() => (row ? buildBadges(row) : []), [row]);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">User Reputation</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading reputation...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && row && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="card">
              <p className="text-lh-muted text-xs">Reputation score</p>
              <p className="text-2xl font-semibold">{row.reputation_score}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Tier</p>
              <p className="text-2xl font-semibold">{tier}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Positive events</p>
              <p className="text-2xl font-semibold">{row.positive_events}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Negative events</p>
              <p className="text-2xl font-semibold">{row.negative_events}</p>
            </div>
          </div>

          <section className="card grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
            <p>Completed bookings: {row.completed_bookings}</p>
            <p>Cancelled bookings: {row.cancelled_bookings}</p>
            <p>On-time payments: {row.on_time_payments}</p>
            <p>Late payments: {row.late_payments}</p>
            <p>Dispute count: {row.dispute_count}</p>
            <p>Abusive flags: {row.abusive_flags}</p>
          </section>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Reputation badges</h2>
            <div className="flex flex-wrap gap-2">
              {badges.length === 0 ? (
                <p className="text-lh-muted text-sm">No badges yet.</p>
              ) : (
                badges.map((badge) => (
                  <span key={badge} className="badge">
                    {badge}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="card space-y-1 text-sm">
            <h2 className="text-lg font-semibold">How to improve</h2>
            <p>Complete bookings</p>
            <p>Avoid cancellations</p>
            <p>Pay on time</p>
            <p>Maintain good communication</p>
          </section>
        </>
      )}
    </section>
  );
}
