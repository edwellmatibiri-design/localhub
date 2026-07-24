"use client";

import { useState } from "react";

export function DocumentDeleteButton({
  documentId,
  onDone,
}: {
  documentId: number;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed"));
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
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
        {loading ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function DocumentDownloadButton({ documentId }: { documentId: number }) {
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
      if (!response.ok || !payload?.ok || !payload.url) {
        throw new Error("Failed to get document URL");
      }

      window.open(String(payload.url), "_blank", "noopener,noreferrer");
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
      {loading ? "Preparing..." : "Download"}
    </button>
  );
}
