"use client";

import { useState } from "react";

export function DisableStaffButton({ staffId }: { staffId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, action: "disable" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to disable staff"));
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable staff");
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
        className="border-lh-danger text-lh-danger rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Disabling..." : "Disable account"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function ResetPermissionsButton({ staffId }: { staffId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, action: "reset_permissions" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(
          String(payload?.error ?? "Failed to reset permissions"),
        );
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset permissions",
      );
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
        {loading ? "Resetting..." : "Reset permissions"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
