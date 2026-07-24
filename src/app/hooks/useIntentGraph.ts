"use client";

import { useCallback, useState } from "react";
import {
  getCanonicalIntent,
  getIntent,
  getIntentPath,
  getRelatedIntents,
} from "@/lib/intent/graph";

type IntentGraphData = {
  intent?: unknown;
  edges?: unknown[];
  relatedIntents?: unknown[];
  canonicalIntentId?: string | null;
  canonicalIntent?: unknown | null;
  from?: string;
  to?: string;
  path?: string[];
};

export function useIntentGraph() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IntentGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(action: () => Promise<T>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await action();
      setData(result as IntentGraphData);
      return result;
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error ? err.message : "Intent graph request failed",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIntent = useCallback(
    (intentId: string) => run(() => getIntent(intentId)),
    [run],
  );
  const fetchRelated = useCallback(
    (intentId: string) => run(() => getRelatedIntents(intentId)),
    [run],
  );
  const fetchCanonical = useCallback(
    (keyword: string) => run(() => getCanonicalIntent(keyword)),
    [run],
  );
  const fetchPath = useCallback(
    (from: string, to: string) => run(() => getIntentPath(from, to)),
    [run],
  );

  return {
    loading,
    data,
    error,
    fetchIntent,
    fetchRelated,
    fetchCanonical,
    fetchPath,
  };
}
