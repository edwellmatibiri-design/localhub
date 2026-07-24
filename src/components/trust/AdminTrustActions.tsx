"use client";

import { useState } from "react";

export default function AdminTrustActions({ userId }: { userId: string }) {
  const [score, setScore] = useState("50");
  const [flagType, setFlagType] = useState("abusive_message");
  const [loading, setLoading] = useState<
    "score" | "flag" | "lock" | "unlock" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    action:
      | "adjust_trust_score"
      | "flag_user"
      | "lock_user_bookings"
      | "unlock_user_bookings",
  ) {
    setLoading(
      action === "adjust_trust_score"
        ? "score"
        : action === "flag_user"
          ? "flag"
          : action === "lock_user_bookings"
            ? "lock"
            : "unlock",
    );
    setError(null);

    try {
      const response = await fetch("/api/admin/trust/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId,
          trustScore: Number(score),
          flagType,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to apply trust action"),
        );
      }

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to apply trust action",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={score}
          onChange={(event) => setScore(event.target.value)}
          className="border-lh-border w-24 rounded border px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={() => void run("adjust_trust_score")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "score" ? "Updating..." : "Adjust trust score"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={flagType}
          onChange={(event) => setFlagType(event.target.value)}
          className="border-lh-border rounded border px-2 py-1 text-xs"
        >
          <option value="abusive_message">abusive_message</option>
          <option value="spam_lead">spam_lead</option>
          <option value="repeated_cancellation">repeated_cancellation</option>
          <option value="fraud_suspected">fraud_suspected</option>
        </select>
        <button
          type="button"
          onClick={() => void run("flag_user")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "flag" ? "Flagging..." : "Flag user"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run("lock_user_bookings")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "lock" ? "Locking..." : "Lock user bookings"}
        </button>
        <button
          type="button"
          onClick={() => void run("unlock_user_bookings")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "unlock" ? "Unlocking..." : "Unlock user bookings"}
        </button>
      </div>

      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
