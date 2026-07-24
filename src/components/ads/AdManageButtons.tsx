"use client";

import { useState } from "react";

type Action =
  | "pause"
  | "resume"
  | "edit_budget"
  | "extend_duration"
  | "adjust_bid"
  | "adjust_daily_budget"
  | "force_pause"
  | "force_resume";

export function AdActionButton({
  adId,
  action,
  label,
  payload,
  onDone,
}: {
  adId: number;
  action: Action;
  label: string;
  payload?: Record<string, unknown>;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ads/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, action, ...(payload ?? {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) {
        throw new Error(String(result?.error ?? "Failed to update ad"));
      }
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ad");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Updating..." : label}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function AdBudgetEditor({
  adId,
  dailyBudget,
  bidAmount,
  onDone,
}: {
  adId: number;
  dailyBudget: number;
  bidAmount: number;
  onDone?: () => void;
}) {
  const [budget, setBudget] = useState(dailyBudget);
  const [bid, setBid] = useState(bidAmount);
  const [extraDays, setExtraDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "edit_budget" | "adjust_bid" | "extend_duration") {
    setError(null);
    const payload =
      action === "edit_budget"
        ? { dailyBudget: budget }
        : action === "adjust_bid"
          ? { bidAmount: bid }
          : { extraDays };

    const response = await fetch("/api/ads/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId, action, ...payload }),
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      setError(String(result?.error ?? "Failed to update ad"));
      return;
    }

    onDone?.();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          value={budget}
          onChange={(event) => setBudget(Number(event.target.value))}
          className="border-lh-border w-28 rounded border px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={() => void run("edit_budget")}
          className="border-lh-border rounded border px-3 py-1 text-xs"
        >
          Edit budget
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          value={bid}
          onChange={(event) => setBid(Number(event.target.value))}
          className="border-lh-border w-28 rounded border px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={() => void run("adjust_bid")}
          className="border-lh-border rounded border px-3 py-1 text-xs"
        >
          Adjust bid
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          value={extraDays}
          onChange={(event) => setExtraDays(Number(event.target.value))}
          className="border-lh-border w-28 rounded border px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={() => void run("extend_duration")}
          className="border-lh-border rounded border px-3 py-1 text-xs"
        >
          Extend duration
        </button>
      </div>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
