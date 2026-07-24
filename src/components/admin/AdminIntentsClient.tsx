"use client";

import { useState } from "react";
import { useIntentGraph } from "@/app/hooks/useIntentGraph";

type IntentRow = {
  id: string;
  keyword: string;
  created_at: string;
};

export default function AdminIntentsClient({
  intents,
}: {
  intents: IntentRow[];
}) {
  const { fetchRelated, loading } = useIntentGraph();
  const [relatedData, setRelatedData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleViewRelated(intentId: string) {
    setError(null);
    const result = await fetchRelated(intentId);
    if (!result) {
      setError("Could not load related intents");
      return;
    }
    setRelatedData(result);
  }

  async function handleGenerate(intentId: string) {
    setError(null);
    try {
      const response = await fetch("/api/page/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(String(payload?.error ?? "Failed to generate page"));
      }
      setRelatedData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate page");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Intents</h2>
      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Keyword</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {intents.map((row) => (
              <tr key={row.id} className="border-lh-border border-t">
                <td className="text-lh-muted px-3 py-2 text-xs">{row.id}</td>
                <td className="px-3 py-2">{row.keyword}</td>
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewRelated(row.id)}
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      View related intents
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerate(row.id)}
                      className="bg-lh-accent text-lh-on-accent rounded px-3 py-1"
                    >
                      Trigger page generation
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p className="text-lh-muted text-sm">Loading...</p>}
      {error && <p className="text-lh-danger text-sm">{error}</p>}
      {relatedData !== null ? (
        <pre className="card overflow-x-auto text-xs">
          {JSON.stringify(relatedData, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
