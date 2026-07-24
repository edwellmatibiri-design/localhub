"use client";

import { useCrawlOptimizer } from "@/app/hooks/useCrawlOptimizer";

export default function AdminCrawlPage() {
  const { loading, data, error, refresh } = useCrawlOptimizer();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Crawl Budget</h2>
        <button
          type="button"
          onClick={() => refresh()}
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
        >
          Recompute Crawl Priority
        </button>
      </div>

      {loading && (
        <p className="text-lh-muted text-sm">Calculating crawl priority...</p>
      )}
      {error && <p className="text-lh-danger text-sm">{error}</p>}

      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">URL</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Freshness</th>
              <th className="px-3 py-2 font-medium">Age Days</th>
              <th className="px-3 py-2 font-medium">Internal Links</th>
            </tr>
          </thead>
          <tbody>
            {(data?.pages ?? []).map((page) => (
              <tr key={page.url} className="border-lh-border border-t">
                <td className="text-lh-muted px-3 py-2 text-xs">{page.url}</td>
                <td className="px-3 py-2">{page.priority}</td>
                <td className="px-3 py-2">{page.freshness}</td>
                <td className="px-3 py-2">{page.ageDays}</td>
                <td className="px-3 py-2">{page.internalLinks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
