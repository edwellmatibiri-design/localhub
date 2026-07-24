"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayoutProcessButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runProcess() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/payouts/process", {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to process payouts"));
      }

      setResult(
        `Processed: ${payload.processed}, Paid: ${payload.paid}, Failed: ${payload.failed}`,
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process payouts",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={runProcess}
        disabled={loading}
        className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Processing..." : "Process Payouts Now"}
      </button>
      {result && <p className="text-lh-emerald text-sm">{result}</p>}
      {error && <p className="text-lh-danger text-sm">{error}</p>}
    </div>
  );
}
