"use client";

import { useState } from "react";
import { getRelatedIntents } from "@/lib/intent/graph";

type IntentRow = {
  id: string;
  keyword: string;
  intent: string;
  micro_intent: string | null;
  landing_path: string;
  score: number;
};

type Props = {
  intents: IntentRow[];
};

export default function AdminIntentTable({ intents }: Props) {
  const [activeIntentId, setActiveIntentId] = useState<string | null>(null);
  const [relatedResult, setRelatedResult] = useState<unknown>(null);
  const [generationResult, setGenerationResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleViewRelated(intentId: string) {
    setError(null);
    setActiveIntentId(intentId);

    try {
      const result = await getRelatedIntents(intentId);
      setRelatedResult(result);
    } catch (err) {
      setRelatedResult(null);
      setError(
        err instanceof Error ? err.message : "Failed to fetch related intents",
      );
    }
  }

  async function handleGeneratePage(intentId: string) {
    setError(null);
    setActiveIntentId(intentId);

    try {
      const response = await fetch("/api/page/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ intentId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(String(payload?.error ?? "Page generation failed"));
      }

      setGenerationResult(payload);
    } catch (err) {
      setGenerationResult(null);
      setError(err instanceof Error ? err.message : "Page generation failed");
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Intent Nodes</h2>
      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Keyword</th>
              <th className="px-3 py-2 font-medium">Intent</th>
              <th className="px-3 py-2 font-medium">Path</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {intents.map((row) => (
              <tr key={row.id} className="border-lh-border border-t">
                <td className="px-3 py-2">{row.keyword}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{row.intent}</div>
                  {row.micro_intent && (
                    <div className="text-lh-muted text-xs">
                      {row.micro_intent}
                    </div>
                  )}
                </td>
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {row.landing_path}
                </td>
                <td className="px-3 py-2">
                  {Number(row.score ?? 0).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewRelated(row.id)}
                      className="border-lh-border rounded-md border px-2 py-1 text-xs font-medium"
                    >
                      View Related
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGeneratePage(row.id)}
                      className="bg-lh-accent text-lh-on-accent rounded-md px-2 py-1 text-xs font-medium"
                    >
                      Trigger Generation
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-lh-danger text-sm">{error}</p>}
      {activeIntentId && (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-lh-muted mb-1 text-xs font-medium">
              Related Intents Result ({activeIntentId})
            </p>
            <pre className="border-lh-border overflow-x-auto rounded-lg border p-3 text-xs">
              {JSON.stringify(relatedResult, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-lh-muted mb-1 text-xs font-medium">
              Page Generation Result ({activeIntentId})
            </p>
            <pre className="border-lh-border overflow-x-auto rounded-lg border p-3 text-xs">
              {JSON.stringify(generationResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
