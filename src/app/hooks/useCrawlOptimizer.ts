"use client";

import { useCallback, useEffect, useState } from "react";

export type CrawlOptimizedPage = {
  url: string;
  priority: number;
  freshness: number;
  ageDays: number;
  internalLinks: number;
  impressions: number;
};

type CrawlOptimizerResponse = {
  pages: CrawlOptimizedPage[];
};

export function useCrawlOptimizer(initialLimit?: number) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CrawlOptimizerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (limit = initialLimit) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/crawl/optimizer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: limit ? JSON.stringify({ limit }) : JSON.stringify({}),
        });

        const payload = (await response.json()) as
          | CrawlOptimizerResponse
          | { error?: string };
        if (!response.ok) {
          setData(null);
          setError(
            String(
              (payload as { error?: string }).error ??
                "Failed to optimize crawl budget",
            ),
          );
          return null;
        }

        const result = payload as CrawlOptimizerResponse;
        setData(result);
        return result;
      } catch (err) {
        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to optimize crawl budget",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [initialLimit],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    data,
    error,
    refresh,
  };
}
