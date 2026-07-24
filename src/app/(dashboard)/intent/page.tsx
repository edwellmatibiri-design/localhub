"use client";

import { useState } from "react";
import { useIntentGraph } from "@/app/hooks/useIntentGraph";

export default function IntentDashboardPage() {
  const [intentId, setIntentId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const {
    loading,
    data,
    error,
    fetchIntent,
    fetchRelated,
    fetchCanonical,
    fetchPath,
  } = useIntentGraph();

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Intent Graph</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={intentId}
            onChange={(event) => setIntentId(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="Intent ID"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchIntent(intentId)}
              className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-2 text-sm font-medium"
            >
              Fetch Intent
            </button>
            <button
              type="button"
              onClick={() => fetchRelated(intentId)}
              className="border-lh-border rounded-lg border px-3 py-2 text-sm font-medium"
            >
              Fetch Related
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="Keyword for canonical intent"
          />
          <button
            type="button"
            onClick={() => fetchCanonical(keyword)}
            className="border-lh-border rounded-lg border px-3 py-2 text-sm font-medium"
          >
            Find Canonical
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="From intent ID"
          />
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="To intent ID"
          />
          <button
            type="button"
            onClick={() => fetchPath(from, to)}
            className="border-lh-border rounded-lg border px-3 py-2 text-sm font-medium"
          >
            Find Path
          </button>
        </div>
      </div>

      <div className="card">
        <p className="text-lh-muted text-sm">
          {loading ? "Loading..." : error ? error : "Latest result"}
        </p>
        <pre className="border-lh-border mt-3 overflow-x-auto rounded-lg border p-3 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
