"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";

type Tx = {
  id: number;
  points: number;
  type: string;
  created_at: string;
};

const TIER_BOUNDS = {
  bronze: { min: 0, max: 499, benefit: "Basic rewards" },
  silver: { min: 500, max: 1499, benefit: "1% cashback" },
  gold: { min: 1500, max: 4999, benefit: "2% cashback" },
  platinum: { min: 5000, max: Infinity, benefit: "5% cashback" },
} as const;

export default function AccountLoyaltyPage() {
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [tier, setTier] = useState<"bronze" | "silver" | "gold" | "platinum">(
    "bronze",
  );
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [referralEmail, setReferralEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralMessage, setReferralMessage] = useState<string | null>(null);

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

        const response = await fetch("/api/loyalty/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(
            String(payload?.error ?? "Failed to load loyalty profile"),
          );
        }

        setPoints(Number(payload.points ?? 0));
        setLifetimePoints(Number(payload.lifetime_points ?? 0));
        setTier(
          String(payload.tier ?? "bronze") as
            | "bronze"
            | "silver"
            | "gold"
            | "platinum",
        );
        setTransactions((payload.recentTransactions ?? []) as Tx[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load loyalty profile",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const progress = useMemo(() => {
    if (tier === "platinum") {
      return { nextTier: "Platinum", pointsToNext: 0, ratio: 100 };
    }

    const nextTier =
      tier === "bronze" ? "silver" : tier === "silver" ? "gold" : "platinum";
    const bound = TIER_BOUNDS[tier];
    const nextMin = TIER_BOUNDS[nextTier as "silver" | "gold" | "platinum"].min;
    const span = nextMin - bound.min;
    const within = Math.max(0, Math.min(span, lifetimePoints - bound.min));
    return {
      nextTier: nextTier.charAt(0).toUpperCase() + nextTier.slice(1),
      pointsToNext: Math.max(0, nextMin - lifetimePoints),
      ratio: span > 0 ? (within / span) * 100 : 100,
    };
  }, [lifetimePoints, tier]);

  async function createReferral() {
    setReferralMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/referrals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerId: userId,
          referredEmail: referralEmail,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to create referral"));
      }
      setReferralMessage("Referral invite queued.");
      setReferralEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create referral",
      );
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Loyalty & Rewards</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading loyalty profile...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && userId && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="card">
              <p className="text-lh-muted text-xs">Current points</p>
              <p className="text-2xl font-semibold">{points}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Lifetime points</p>
              <p className="text-2xl font-semibold">{lifetimePoints}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Tier</p>
              <p className="text-2xl font-semibold capitalize">{tier}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Next tier</p>
              <p className="text-2xl font-semibold">{progress.nextTier}</p>
            </div>
          </div>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Progress to next tier</h2>
            {tier === "platinum" ? (
              <p className="text-lh-muted text-sm">Top tier unlocked.</p>
            ) : (
              <>
                <div className="bg-lh-border/40 h-2 w-full rounded">
                  <div
                    className="bg-lh-accent h-full rounded"
                    style={{ width: `${progress.ratio}%` }}
                  />
                </div>
                <p className="text-lh-muted text-sm">
                  {progress.pointsToNext} points to {progress.nextTier}.
                </p>
              </>
            )}
          </section>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Tier benefits</h2>
            <ul className="space-y-1 text-sm">
              <li>Bronze: basic rewards</li>
              <li>Silver: 1% cashback</li>
              <li>Gold: 2% cashback</li>
              <li>Platinum: 5% cashback</li>
            </ul>
          </section>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Refer and earn</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={referralEmail}
                onChange={(event) => setReferralEmail(event.target.value)}
                placeholder="friend@example.com"
                className="border-lh-border rounded border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void createReferral()}
                className="border-lh-border rounded border px-3 py-2 text-xs"
              >
                Send referral invite
              </button>
            </div>
            {referralMessage && (
              <p className="text-lh-emerald text-sm">{referralMessage}</p>
            )}
          </section>

          <section className="card space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent transactions</h2>
              <Link
                href="/account/loyalty/badges"
                className="text-sm underline"
              >
                View badges
              </Link>
            </div>
            {transactions.length === 0 ? (
              <p className="text-lh-muted text-sm">No transactions yet.</p>
            ) : (
              transactions.map((tx) => (
                <article
                  key={tx.id}
                  className="border-lh-border flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {tx.type.replaceAll("_", " ")}
                    </p>
                    <p className="text-lh-muted text-xs">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${tx.points >= 0 ? "text-lh-emerald" : "text-lh-on-accent"}`}
                  >
                    {tx.points >= 0 ? `+${tx.points}` : tx.points}
                  </p>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </section>
  );
}
