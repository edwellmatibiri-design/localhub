"use client";

import { useState } from "react";

type RoutingStrategy =
  | "round_robin"
  | "top_ranked"
  | "balanced"
  | "fastest_response";

type Rule = {
  id: number;
  category: string;
  location: string;
  max_vendors: number;
  routing_strategy: RoutingStrategy;
  created_at: string;
};

const STRATEGIES: RoutingStrategy[] = [
  "round_robin",
  "top_ranked",
  "balanced",
  "fastest_response",
];

export default function RoutingRulesClient({
  initialRules,
}: {
  initialRules: Rule[];
}) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [maxVendors, setMaxVendors] = useState(3);
  const [routingStrategy, setRoutingStrategy] =
    useState<RoutingStrategy>("top_ranked");
  const [error, setError] = useState<string | null>(null);

  async function addRule() {
    setError(null);
    try {
      const response = await fetch("/api/routing/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          location,
          max_vendors: maxVendors,
          routing_strategy: routingStrategy,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to add rule"));
      }

      const next = payload.rule as Rule;
      setRules((current) => {
        const withoutExisting = current.filter((rule) => rule.id !== next.id);
        return [next, ...withoutExisting];
      });
      setCategory("");
      setLocation("");
      setMaxVendors(3);
      setRoutingStrategy("top_ranked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add rule");
    }
  }

  async function saveRule(rule: Rule) {
    setError(null);
    try {
      const response = await fetch("/api/routing/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rule.id,
          max_vendors: rule.max_vendors,
          routing_strategy: rule.routing_strategy,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to update rule"));
      }

      const updated = payload.rule as Rule;
      setRules((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rule");
    }
  }

  async function deleteRule(id: number) {
    setError(null);
    try {
      const response = await fetch("/api/routing/rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to delete rule"));
      }

      setRules((current) => current.filter((rule) => rule.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  }

  return (
    <section className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Add Routing Rule</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="category slug"
            className="border-lh-border rounded-lg border px-3 py-2"
          />
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="location slug"
            className="border-lh-border rounded-lg border px-3 py-2"
          />
          <input
            type="number"
            min={1}
            max={20}
            value={maxVendors}
            onChange={(event) => setMaxVendors(Number(event.target.value))}
            className="border-lh-border rounded-lg border px-3 py-2"
          />
          <select
            value={routingStrategy}
            onChange={(event) =>
              setRoutingStrategy(event.target.value as RoutingStrategy)
            }
            className="border-lh-border rounded-lg border px-3 py-2"
          >
            {STRATEGIES.map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={addRule}
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
        >
          Add rule
        </button>
      </div>

      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Max Vendors</th>
              <th className="px-3 py-2 font-medium">Routing Strategy</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-lh-border border-t">
                <td className="px-3 py-2">{rule.category}</td>
                <td className="px-3 py-2">{rule.location}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={rule.max_vendors}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setRules((current) =>
                        current.map((item) =>
                          item.id === rule.id
                            ? { ...item, max_vendors: value }
                            : item,
                        ),
                      );
                    }}
                    className="border-lh-border w-20 rounded border px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={rule.routing_strategy}
                    onChange={(event) => {
                      const value = event.target.value as RoutingStrategy;
                      setRules((current) =>
                        current.map((item) =>
                          item.id === rule.id
                            ? { ...item, routing_strategy: value }
                            : item,
                        ),
                      );
                    }}
                    className="border-lh-border rounded border px-2 py-1"
                  >
                    {STRATEGIES.map((strategy) => (
                      <option key={strategy} value={strategy}>
                        {strategy}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveRule(rule)}
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      Edit rule
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.id)}
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      Delete rule
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-lh-danger text-sm">{error}</p>}
    </section>
  );
}
