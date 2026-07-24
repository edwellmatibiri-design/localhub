"use client";

import { useState } from "react";

type AdminCommsActionButtonProps = {
  label: string;
  action:
    | "disable_vendor_calling"
    | "enable_vendor_calling"
    | "remove_recording";
  vendorId?: string;
  callId?: number;
};

export default function AdminCommsActionButton({
  label,
  action,
  vendorId,
  callId,
}: AdminCommsActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/comms/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, vendorId, callId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to execute admin action"),
        );
      }
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to execute admin action",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Updating..." : label}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
