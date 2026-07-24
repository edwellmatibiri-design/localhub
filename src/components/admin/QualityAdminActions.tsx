"use client";

import { useState } from "react";

export function ResolveFlagButton({ flagId }: { flagId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveFlag() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quality/flags/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to resolve flag"));
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve flag");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={resolveFlag}
        disabled={loading}
        className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Resolving..." : "Resolve flag"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function VendorActionButton({
  vendorId,
  action,
  label,
}: {
  vendorId: string;
  action: "suppress" | "restore" | "ban";
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quality/vendor-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, action }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed vendor action"));
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed vendor action");
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
        className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Running..." : label}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
