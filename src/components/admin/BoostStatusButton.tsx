"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  boostId: number;
  action: "force_activate" | "force_expire";
};

export default function BoostStatusButton({ boostId, action }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/boosts/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boostId, action }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to update boost"));
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update boost");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={runAction}
        disabled={loading}
        className="border-lh-border rounded-lg border px-3 py-1 text-xs font-medium disabled:opacity-60"
      >
        {loading
          ? "Updating..."
          : action === "force_activate"
            ? "Force Activate"
            : "Force Expire"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
