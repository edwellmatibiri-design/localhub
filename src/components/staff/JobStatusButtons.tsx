"use client";

import { useState } from "react";

export function JobStatusButton({
  assignmentId,
  status,
  label,
}: {
  assignmentId: number;
  status: "assigned" | "in_progress" | "completed";
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/jobs/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, status }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to update job status"),
        );
      }
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update job status",
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
        {loading ? "Updating..." : label}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function JobSheetOpenButton({ documentId }: { documentId: number }) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const response = await fetch("/api/documents/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const payload = await response.json();
      if (response.ok && payload?.ok && payload?.url) {
        window.open(String(payload.url), "_blank", "noopener,noreferrer");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={loading}
      className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
    >
      {loading ? "Opening..." : "Open job sheet"}
    </button>
  );
}
