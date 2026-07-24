"use client";

import { useEffect, useState } from "react";
import { clusterIntent } from "@/lib/intent/clusterIntent";

export function useIntentCluster(keyword: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedKeyword = String(keyword ?? "").trim();
    if (!normalizedKeyword) {
      setLoading(false);
      setData(null);
      setError("keyword is required");
      return;
    }

    let isCancelled = false;

    async function runIntentCluster() {
      setLoading(true);
      setError(null);

      const result = await clusterIntent(normalizedKeyword);

      if (isCancelled) {
        return;
      }

      if (
        typeof result === "object" &&
        result !== null &&
        "ok" in result &&
        !result.ok
      ) {
        const message =
          "error" in result ? String(result.error) : "Intent clustering failed";
        setData(null);
        setError(message);
      } else {
        setData(result);
        setError(null);
      }

      setLoading(false);
    }

    runIntentCluster();

    return () => {
      isCancelled = true;
    };
  }, [keyword]);

  return { loading, data, error };
}
