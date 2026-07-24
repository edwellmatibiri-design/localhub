"use client";

import { useState } from "react";

type GuideRow = {
  id: number;
  title: string;
  category: string | null;
  location: string | null;
  updated_at: string;
};

export default function ContentAdminClient({ guides }: { guides: GuideRow[] }) {
  const [rows, setRows] = useState(guides);
  const [error, setError] = useState<string | null>(null);

  async function regenerate(guideId: number) {
    setError(null);
    const response = await fetch("/api/content/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guideId }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to regenerate guide"));
      return;
    }
    window.location.reload();
  }

  async function remove(guideId: number) {
    setError(null);
    const response = await fetch("/api/content/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guideId }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to delete guide"));
      return;
    }
    setRows((current) => current.filter((row) => row.id !== guideId));
  }

  return (
    <section className="space-y-4">
      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Updated</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((guide) => (
              <tr key={guide.id} className="border-lh-border border-t">
                <td className="px-3 py-2">{guide.title}</td>
                <td className="px-3 py-2">{guide.category ?? "-"}</td>
                <td className="px-3 py-2">{guide.location ?? "-"}</td>
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {new Date(guide.updated_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void regenerate(guide.id)}
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(guide.id)}
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      Delete
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
