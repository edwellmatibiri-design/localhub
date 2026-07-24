"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type Behaviour = {
  searches: number;
  leads_requested: number;
  leads_responded: number;
  bookings_started: number;
  bookings_completed: number;
  bookings_cancelled: number;
  messages_sent: number;
  messages_received: number;
  avg_response_time: number;
};

export default function AccountBehaviourPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [behaviour, setBehaviour] = useState<Behaviour | null>(null);
  const [leadQualityScore, setLeadQualityScore] = useState(0);

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

        const [{ data: behaviourRow }, scoreResponse] = await Promise.all([
          supabase
            .from("user_behaviour")
            .select(
              "searches, leads_requested, leads_responded, bookings_started, bookings_completed, bookings_cancelled, messages_sent, messages_received, avg_response_time",
            )
            .eq("user_id", userId)
            .maybeSingle(),
          fetch("/api/predictive/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          }),
        ]);

        const scorePayload = await scoreResponse.json();
        if (!scoreResponse.ok || !scorePayload?.ok)
          throw new Error(
            String(scorePayload?.error ?? "Failed to load predictive score"),
          );

        setLeadQualityScore(Number(scorePayload.leadQualityScore ?? 0));
        setBehaviour(
          (behaviourRow ?? {
            searches: 0,
            leads_requested: 0,
            leads_responded: 0,
            bookings_started: 0,
            bookings_completed: 0,
            bookings_cancelled: 0,
            messages_sent: 0,
            messages_received: 0,
            avg_response_time: 0,
          }) as Behaviour,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load behaviour insights",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Behaviour Insights</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">
          Loading behaviour insights...
        </p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && behaviour && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="card">
              <p className="text-lh-muted text-xs">Searches</p>
              <p className="text-xl font-semibold">{behaviour.searches}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Leads requested</p>
              <p className="text-xl font-semibold">
                {behaviour.leads_requested}
              </p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Leads responded</p>
              <p className="text-xl font-semibold">
                {behaviour.leads_responded}
              </p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Bookings started</p>
              <p className="text-xl font-semibold">
                {behaviour.bookings_started}
              </p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Lead quality score</p>
              <p className="text-xl font-semibold">{leadQualityScore}</p>
            </div>
          </div>

          <section className="card grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
            <p>Bookings completed: {behaviour.bookings_completed}</p>
            <p>Cancellations: {behaviour.bookings_cancelled}</p>
            <p>Messages sent: {behaviour.messages_sent}</p>
            <p>Messages received: {behaviour.messages_received}</p>
            <p>Avg response time: {behaviour.avg_response_time}s</p>
          </section>

          <section className="card space-y-1 text-sm">
            <h2 className="text-lg font-semibold">Improvement tips</h2>
            <p>Respond quickly</p>
            <p>Avoid cancellations</p>
            <p>Complete bookings</p>
            <p>Communicate clearly</p>
          </section>
        </>
      )}
    </section>
  );
}
