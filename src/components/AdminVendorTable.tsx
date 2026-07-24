"use client";

import { useState } from "react";

type VendorRow = {
  id: string;
  business_name: string;
  trust_score: number;
  last_review_at: string | null;
};

type Props = {
  vendors: VendorRow[];
};

function resolveBadge(trustScore: number) {
  if (trustScore >= 85) return "gold";
  if (trustScore >= 70) return "silver";
  if (trustScore >= 50) return "bronze";
  return "none";
}

export default function AdminVendorTable({ vendors }: Props) {
  const [loadingVendorId, setLoadingVendorId] = useState<string | null>(null);
  const [vendorScores, setVendorScores] = useState<Record<string, number>>({});
  const [vendorBadges, setVendorBadges] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleComputeTrust(vendorId: string) {
    setLoadingVendorId(vendorId);
    setError(null);

    try {
      const response = await fetch("/api/vendor/trust/compute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to compute trust score"),
        );
      }

      const trustScore = Number(payload?.trustScore ?? 0);
      setVendorScores((current) => ({ ...current, [vendorId]: trustScore }));
      setVendorBadges((current) => ({
        ...current,
        [vendorId]: resolveBadge(trustScore),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compute trust score",
      );
    } finally {
      setLoadingVendorId(null);
    }
  }

  async function handleGetBadge(vendorId: string) {
    setLoadingVendorId(vendorId);
    setError(null);

    try {
      const response = await fetch("/api/vendor/trust/badge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to fetch trust badge"),
        );
      }

      const trustScore = Number(
        payload?.trustScore ?? vendorScores[vendorId] ?? 0,
      );
      const badge = String(payload?.badge ?? resolveBadge(trustScore));

      setVendorScores((current) => ({ ...current, [vendorId]: trustScore }));
      setVendorBadges((current) => ({ ...current, [vendorId]: badge }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch trust badge",
      );
    } finally {
      setLoadingVendorId(null);
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Vendor Trust</h2>
      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Vendor</th>
              <th className="px-3 py-2 font-medium">Trust Score</th>
              <th className="px-3 py-2 font-medium">Badge</th>
              <th className="px-3 py-2 font-medium">Last Review</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => {
              const trustScore = vendorScores[vendor.id] ?? vendor.trust_score;
              const badge = vendorBadges[vendor.id] ?? resolveBadge(trustScore);

              return (
                <tr key={vendor.id} className="border-lh-border border-t">
                  <td className="px-3 py-2 font-medium">
                    {vendor.business_name}
                  </td>
                  <td className="px-3 py-2">{Math.round(trustScore)}</td>
                  <td className="px-3 py-2 capitalize">{badge}</td>
                  <td className="text-lh-muted px-3 py-2 text-xs">
                    {vendor.last_review_at
                      ? new Date(vendor.last_review_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleComputeTrust(vendor.id)}
                        disabled={loadingVendorId === vendor.id}
                        className="border-lh-border rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
                      >
                        Compute
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGetBadge(vendor.id)}
                        disabled={loadingVendorId === vendor.id}
                        className="bg-lh-accent text-lh-on-accent rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50"
                      >
                        Get Badge
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && <p className="text-lh-danger text-sm">{error}</p>}
    </section>
  );
}
