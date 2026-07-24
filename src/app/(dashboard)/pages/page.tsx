"use client";

import { useState } from "react";
import { useGeneratePage } from "@/app/hooks/useGeneratePage";

export default function PageGeneratorDashboardPage() {
  const [intentId, setIntentId] = useState("");
  const { loading, saving, data, error, regenerate, save } =
    useGeneratePage(intentId);

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Page Generator</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            value={intentId}
            onChange={(event) => setIntentId(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="Intent ID"
          />
          <button
            type="button"
            onClick={() => regenerate()}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-2 text-sm font-medium"
          >
            Generate
          </button>
          <button
            type="button"
            onClick={() => save()}
            className="border-lh-border rounded-lg border px-3 py-2 text-sm font-medium"
          >
            Save
          </button>
        </div>
        <p className="text-lh-muted text-sm">
          {loading
            ? "Generating..."
            : saving
              ? "Saving..."
              : (error ?? "Ready")}
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
