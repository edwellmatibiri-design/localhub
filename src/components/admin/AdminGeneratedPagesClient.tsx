"use client";

import { useState } from "react";
import { useGeneratePage } from "@/app/hooks/useGeneratePage";

type GeneratedPageRow = {
  intent_id: string;
  title: string;
  updated_at: string;
  meta_description: string;
  h1: string;
  h2: unknown;
  h3: unknown;
  faqs: unknown;
  schema: unknown;
  internal_links: unknown;
};

function RegenerateButton({ intentId }: { intentId: string }) {
  const { loading, regenerate } = useGeneratePage(intentId);

  return (
    <button
      type="button"
      onClick={() => regenerate()}
      disabled={loading}
      className="bg-lh-accent text-lh-on-accent rounded px-3 py-1 disabled:opacity-60"
    >
      {loading ? "Regenerating..." : "Regenerate page"}
    </button>
  );
}

export default function AdminGeneratedPagesClient({
  pages,
}: {
  pages: GeneratedPageRow[];
}) {
  const [selectedJson, setSelectedJson] = useState<unknown>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Generated Pages</h2>
      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Intent ID</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Updated</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((row) => (
              <tr key={row.intent_id} className="border-lh-border border-t">
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {row.intent_id}
                </td>
                <td className="px-3 py-2">{row.title}</td>
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {new Date(row.updated_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJson(row)}
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      View full generated page JSON
                    </button>
                    <RegenerateButton intentId={row.intent_id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedJson !== null ? (
        <pre className="card overflow-x-auto text-xs">
          {JSON.stringify(selectedJson, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
