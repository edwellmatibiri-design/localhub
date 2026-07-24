"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";

type BadgeRow = {
  badge: string;
  created_at: string;
};

const BADGE_TARGETS = [
  { name: "First Booking", kind: "bookings", target: 1 },
  { name: "5 Bookings", kind: "bookings", target: 5 },
  { name: "10 Bookings", kind: "bookings", target: 10 },
  { name: "Top Reviewer", kind: "reviews", target: 10 },
  { name: "Platinum Member", kind: "tier", target: 5000 },
] as const;

export default function LoyaltyBadgesPage() {
  const [userId, setUserId] = useState("");
  const [earned, setEarned] = useState<BadgeRow[]>([]);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const id = String(auth?.user?.id ?? "");
        setUserId(id);
        if (!id) {
          setLoading(false);
          return;
        }

        const [
          { data: badges },
          { count: bookingsCount },
          { count: reviewsCount },
          { data: loyalty },
        ] = await Promise.all([
          supabase
            .from("badges")
            .select("badge, created_at")
            .eq("user_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", id)
            .eq("status", "completed"),
          supabase
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .eq("user_id", id),
          supabase
            .from("loyalty_points")
            .select("lifetime_points")
            .eq("user_id", id)
            .maybeSingle(),
        ]);

        setEarned((badges ?? []) as BadgeRow[]);
        setCompletedBookings(Number(bookingsCount ?? 0));
        setReviewCount(Number(reviewsCount ?? 0));
        setLifetimePoints(Number(loyalty?.lifetime_points ?? 0));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load badges");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const earnedSet = useMemo(
    () => new Set(earned.map((row) => row.badge)),
    [earned],
  );

  function getProgress(kind: "bookings" | "reviews" | "tier", target: number) {
    const current =
      kind === "bookings"
        ? completedBookings
        : kind === "reviews"
          ? reviewCount
          : lifetimePoints;
    const ratio =
      target > 0 ? Math.max(0, Math.min(100, (current / target) * 100)) : 100;
    return { current, target, ratio };
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">My Badges</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading badges...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && userId && (
        <>
          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Earned badges</h2>
            {earned.length === 0 ? (
              <p className="text-lh-muted text-sm">No badges earned yet.</p>
            ) : (
              earned.map((badge) => (
                <article
                  key={`${badge.badge}-${badge.created_at}`}
                  className="border-lh-border flex items-center justify-between rounded border p-3 text-sm"
                >
                  <p className="font-medium">{badge.badge}</p>
                  <p className="text-lh-muted text-xs">
                    {new Date(badge.created_at).toLocaleDateString()}
                  </p>
                </article>
              ))
            )}
          </section>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Locked badges</h2>
            {BADGE_TARGETS.filter((badge) => !earnedSet.has(badge.name)).map(
              (badge) => {
                const progress = getProgress(badge.kind, badge.target);
                return (
                  <article
                    key={badge.name}
                    className="border-lh-border space-y-2 rounded border p-3 text-sm"
                  >
                    <p className="font-medium">{badge.name}</p>
                    <div className="bg-lh-border/40 h-2 w-full rounded">
                      <div
                        className="bg-lh-accent h-full rounded"
                        style={{ width: `${progress.ratio}%` }}
                      />
                    </div>
                    <p className="text-lh-muted text-xs">
                      {progress.current} / {progress.target}
                    </p>
                  </article>
                );
              },
            )}
            {BADGE_TARGETS.every((badge) => earnedSet.has(badge.name)) && (
              <p className="text-lh-muted text-sm">All badges unlocked.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
