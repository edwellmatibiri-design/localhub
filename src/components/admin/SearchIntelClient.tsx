"use client";

import { useState } from "react";

type Suggestion = {
  id: number;
  keyword: string;
  type: "category" | "location" | "vendor" | "listing" | "intent";
  score: number;
  updated_at: string;
};

type IntentRow = {
  id: string;
  keyword: string;
  search_count: number;
};

type TrendRow = {
  keyword: string;
  score: number;
};

const TYPES: Array<Suggestion["type"]> = [
  "category",
  "location",
  "vendor",
  "listing",
  "intent",
];

export default function SearchIntelClient({
  topSearched,
  trending,
  suggestions,
}: {
  topSearched: IntentRow[];
  trending: TrendRow[];
  suggestions: Suggestion[];
}) {
  const [items, setItems] = useState<Suggestion[]>(suggestions);
  const [manualKeyword, setManualKeyword] = useState("");
  const [manualType, setManualType] = useState<Suggestion["type"]>("intent");
  const [graphKeyword, setGraphKeyword] = useState(
    topSearched[0]?.keyword ?? "",
  );
  const [graphData, setGraphData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function boostSuggestion(keyword: string, type: Suggestion["type"]) {
    setError(null);
    const response = await fetch("/api/search/suggestions/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, type, scoreDelta: 5 }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to boost suggestion"));
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.keyword === keyword && item.type === type
          ? { ...item, score: item.score + 5 }
          : item,
      ),
    );
  }

  async function removeSuggestion(id: number) {
    setError(null);
    const response = await fetch("/api/search/suggestions/manage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to remove suggestion"));
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function addManualSuggestion() {
    setError(null);
    const response = await fetch("/api/search/suggestions/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: manualKeyword,
        type: manualType,
        scoreDelta: 1,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to add manual suggestion"));
      return;
    }

    setItems((current) => [
      {
        id: Number(payload.id),
        keyword: manualKeyword.toLowerCase(),
        type: manualType,
        score: 1,
        updated_at: new Date().toISOString(),
      },
      ...current,
    ]);
    setManualKeyword("");
  }

  async function loadExpansionGraph() {
    setError(null);
    const response = await fetch("/api/intent/expand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: graphKeyword }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(String(payload?.error ?? "Failed to load intent expansion"));
      return;
    }

    setGraphData(payload);
  }

  return (
    <section className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Top Searched Keywords</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {topSearched.slice(0, 12).map((item) => (
            <div
              key={item.id}
              className="border-lh-border rounded-lg border px-3 py-2"
            >
              <p className="font-medium">{item.keyword}</p>
              <p className="text-lh-muted text-xs">
                search_count: {Number(item.search_count ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Trending Keywords</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {trending.slice(0, 12).map((item) => (
            <div
              key={item.keyword}
              className="border-lh-border rounded-lg border px-3 py-2"
            >
              <p className="font-medium">{item.keyword}</p>
              <p className="text-lh-muted text-xs">trend score: {item.score}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Suggestion Scores</h2>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            value={manualKeyword}
            onChange={(event) => setManualKeyword(event.target.value)}
            placeholder="manual keyword"
            className="border-lh-border rounded-lg border px-3 py-2"
          />
          <select
            value={manualType}
            onChange={(event) =>
              setManualType(event.target.value as Suggestion["type"])
            }
            className="border-lh-border rounded-lg border px-3 py-2"
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <div />
          <button
            type="button"
            onClick={addManualSuggestion}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm"
          >
            Add manual suggestion
          </button>
        </div>

        <div className="border-lh-border overflow-x-auto rounded-lg border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-lh-surface-soft text-lh-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Keyword</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-lh-border border-t">
                  <td className="px-3 py-2">{item.keyword}</td>
                  <td className="px-3 py-2 capitalize">{item.type}</td>
                  <td className="px-3 py-2">{item.score}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void boostSuggestion(item.keyword, item.type)
                        }
                        className="border-lh-border rounded border px-3 py-1"
                      >
                        Boost suggestion score
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeSuggestion(item.id)}
                        className="border-lh-border rounded border px-3 py-1"
                      >
                        Remove suggestion
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Intent Expansion Graph</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={graphKeyword}
            onChange={(event) => setGraphKeyword(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
          />
          <button
            type="button"
            onClick={loadExpansionGraph}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm"
          >
            Load graph
          </button>
        </div>
        {graphData !== null ? (
          <pre className="border-lh-border max-h-64 overflow-auto rounded-lg border p-3 text-xs">
            {JSON.stringify(graphData, null, 2)}
          </pre>
        ) : null}
      </div>

      {error && <p className="text-lh-danger text-sm">{error}</p>}
    </section>
  );
}
