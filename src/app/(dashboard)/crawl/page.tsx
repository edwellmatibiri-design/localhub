"use client";

import { useState } from "react";
import { useCrawlOptimizer } from "@/app/hooks/useCrawlOptimizer";

export default function CrawlDashboardPage() {
  const [limit, setLimit] = useState("10");
  const { loading, data, error, refresh } = useCrawlOptimizer();

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Crawl Optimizer</h2>
        <div className="grid gap-3 md:grid-cols-[200px_auto]">
          <input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="Limit"
          />
          <button
            type="button"
            onClick={() => refresh(Math.max(1, Number(limit) || 1))}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-2 text-sm font-medium"
          >
            Run Optimization
          </button>
        </div>
        <p className="text-lh-muted text-sm">
          {loading ? "Optimizing crawl budget..." : (error ?? "Ready")}
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
