"use client";

import { useState } from "react";

type Props = {
  userId: string;
};

export default function AdminLoyaltyActions({ userId }: Props) {
  const [adjustPoints, setAdjustPoints] = useState("0");
  const [promoPoints, setPromoPoints] = useState("0");
  const [badge, setBadge] = useState("First Booking");
  const [loading, setLoading] = useState<"adjust" | "promo" | "revoke" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function run(
    action: "adjust_points" | "issue_promo_bonus" | "revoke_badge",
  ) {
    setLoading(
      action === "adjust_points"
        ? "adjust"
        : action === "issue_promo_bonus"
          ? "promo"
          : "revoke",
    );
    setError(null);

    try {
      const response = await fetch("/api/admin/loyalty/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId,
          points:
            action === "adjust_points"
              ? Number(adjustPoints)
              : Number(promoPoints),
          badge,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to run loyalty action"),
        );
      }

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to run loyalty action",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={adjustPoints}
          onChange={(event) => setAdjustPoints(event.target.value)}
          className="border-lh-border w-24 rounded border px-2 py-1 text-xs"
          placeholder="Adjust"
        />
        <button
          type="button"
          onClick={() => void run("adjust_points")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "adjust" ? "Applying..." : "Adjust points"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={promoPoints}
          onChange={(event) => setPromoPoints(event.target.value)}
          className="border-lh-border w-24 rounded border px-2 py-1 text-xs"
          placeholder="Promo"
        />
        <button
          type="button"
          onClick={() => void run("issue_promo_bonus")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "promo" ? "Issuing..." : "Issue promo"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={badge}
          onChange={(event) => setBadge(event.target.value)}
          className="border-lh-border rounded border px-2 py-1 text-xs"
        >
          <option value="First Booking">First Booking</option>
          <option value="5 Bookings">5 Bookings</option>
          <option value="10 Bookings">10 Bookings</option>
          <option value="Top Reviewer">Top Reviewer</option>
          <option value="Platinum Member">Platinum Member</option>
        </select>
        <button
          type="button"
          onClick={() => void run("revoke_badge")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "revoke" ? "Revoking..." : "Revoke badge"}
        </button>
      </div>

      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
