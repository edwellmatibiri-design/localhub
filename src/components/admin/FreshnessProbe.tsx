"use client";

import { useFreshness } from "@/app/hooks/useFreshness";

export default function FreshnessProbe({ url }: { url: string }) {
  const { loading, data, error, refresh } = useFreshness(url);

  return (
    <div className="card space-y-2">
      <p className="text-sm font-medium">Freshness Probe</p>
      <p className="text-lh-muted text-xs">URL: {url}</p>
      <p className="text-sm">
        {loading
          ? "Checking..."
          : error
            ? error
            : `Score: ${data?.score ?? "-"}`}
      </p>
      <button
        type="button"
        onClick={() => refresh()}
        className="border-lh-border rounded border px-3 py-1 text-sm"
      >
        Refresh Probe
      </button>
    </div>
  );
}
