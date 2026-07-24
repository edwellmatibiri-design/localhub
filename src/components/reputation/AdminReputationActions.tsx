"use client";

import { useState } from "react";

export default function AdminReputationActions({ userId }: { userId: string }) {
  const [score, setScore] = useState("50");
  const [loading, setLoading] = useState<
    "adjust" | "lock" | "unlock" | "flag" | "reset" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    action:
      | "adjust_reputation_score"
      | "lock_user_bookings"
      | "unlock_user_bookings"
      | "flag_user"
      | "reset_reputation",
  ) {
    setLoading(
      action === "adjust_reputation_score"
        ? "adjust"
        : action === "lock_user_bookings"
          ? "lock"
          : action === "unlock_user_bookings"
            ? "unlock"
            : action === "flag_user"
              ? "flag"
              : "reset",
    );
    setError(null);

    try {
      const response = await fetch("/api/admin/reputation/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId,
          reputationScore: Number(score),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to apply action"));
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply action");
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
          onClick={() => void run("adjust_reputation_score")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "adjust" ? "Updating..." : "Adjust score"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run("lock_user_bookings")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "lock" ? "Locking..." : "Lock bookings"}
        </button>
        <button
          type="button"
          onClick={() => void run("unlock_user_bookings")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "unlock" ? "Unlocking..." : "Unlock bookings"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run("flag_user")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "flag" ? "Flagging..." : "Flag user"}
        </button>
        <button
          type="button"
          onClick={() => void run("reset_reputation")}
          disabled={loading !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "reset" ? "Resetting..." : "Reset reputation"}
        </button>
      </div>

      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
