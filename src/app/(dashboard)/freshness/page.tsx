"use client";

import { useState } from "react";
import { useFreshness } from "@/app/hooks/useFreshness";

export default function FreshnessDashboardPage() {
  const [urlInput, setUrlInput] = useState("https://localhub.co.za/");
  const { loading, data, error, refresh } = useFreshness(urlInput);

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Freshness</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="https://localhub.co.za/page-url"
          />
          <button
            type="button"
            onClick={() => refresh()}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-2 text-sm font-medium"
          >
            Score URL
          </button>
        </div>
        <p className="text-lh-muted text-sm">
          {loading ? "Computing freshness..." : (error ?? "Ready")}
        </p>
      </div>

      <div className="card">
        <pre className="border-lh-border overflow-x-auto rounded-lg border p-3 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
