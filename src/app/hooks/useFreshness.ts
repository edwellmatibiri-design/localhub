"use client";

import { useCallback, useEffect, useState } from "react";

type FreshnessSignals = {
  impressions: number;
  clicks: number;
  ctr: number;
  lastIndexedDaysAgo: number;
};

type FreshnessData = {
  url: string;
  score: number;
  signals: FreshnessSignals;
};

export function useFreshness(url: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FreshnessData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const normalizedUrl = String(url ?? "").trim();
    if (!normalizedUrl) {
      setData(null);
      setError("url is required");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/freshness/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const payload = (await response.json()) as
        | FreshnessData
        | { error?: string };
      if (!response.ok) {
        setData(null);
        setError(
          String(
            (payload as { error?: string }).error ??
              "Failed to score freshness",
          ),
        );
        return null;
      }

      const result = payload as FreshnessData;
      setData(result);
      return result;
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error ? err.message : "Failed to score freshness",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!String(url ?? "").trim()) {
      setData(null);
      setError("url is required");
      return;
    }

    refresh();
  }, [url, refresh]);

  return {
    loading,
    data,
    error,
    refresh,
  };
}
