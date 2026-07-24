"use client";

import { useState } from "react";

type Row = {
  id: string;
  title: string;
  vendor: string;
  trustScore: number;
  status: string | null;
  created_at: string;
};

export default function AdminModerationClient({
  listings,
}: {
  listings: Row[];
}) {
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(listingId: string, action: "approve" | "reject") {
    setError(null);

    try {
      const response = await fetch(`/api/listings/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Moderation action failed"));
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Moderation action failed");
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Moderation</h2>

      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Vendor</th>
              <th className="px-3 py-2 font-medium">Trust Score</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-lh-border border-t">
                <td className="px-3 py-2 font-medium">{listing.title}</td>
                <td className="px-3 py-2">{listing.vendor}</td>
                <td className="px-3 py-2">{Math.round(listing.trustScore)}</td>
                <td className="px-3 py-2">pending</td>
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {new Date(listing.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(listing.id, "approve")}
                      className="bg-lh-success text-lh-on-accent rounded px-3 py-1"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(listing.id, "reject")}
                      className="bg-lh-danger text-lh-on-accent rounded px-3 py-1"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      AI Review
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
