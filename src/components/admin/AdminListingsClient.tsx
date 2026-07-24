"use client";

import { useState } from "react";

type ListingRow = {
  id: string;
  title: string;
  vendor: string;
  status: string | null;
  created_at: string;
  description: string;
  price: number;
};

function prettyStatus(value: string | null) {
  if (value === "pending_review") return "pending";
  if (value === "approved") return "approved";
  if (value === "rejected") return "rejected";
  return value ?? "pending";
}

export default function AdminListingsClient({
  listings,
}: {
  listings: ListingRow[];
}) {
  const [active, setActive] = useState<ListingRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateListingStatus(
    listingId: string,
    status: "approve" | "reject",
  ) {
    setError(null);

    try {
      const response = await fetch(`/api/listings/${status}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? `Failed to ${status} listing`),
        );
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Listings</h2>

      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Vendor</th>
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
                <td className="px-3 py-2 capitalize">
                  {prettyStatus(listing.status)}
                </td>
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {new Date(listing.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateListingStatus(listing.id, "approve")}
                      className="bg-lh-success text-lh-on-accent rounded px-3 py-1"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateListingStatus(listing.id, "reject")}
                      className="bg-lh-danger text-lh-on-accent rounded px-3 py-1"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setActive(listing)}
                      className="border-lh-border rounded border px-3 py-1"
                    >
                      View listing details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-lh-danger text-sm">{error}</p>}

      {active && (
        <pre className="card overflow-x-auto text-xs">
          {JSON.stringify(active, null, 2)}
        </pre>
      )}
    </div>
  );
}
