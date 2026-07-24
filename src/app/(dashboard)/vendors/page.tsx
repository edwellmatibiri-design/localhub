"use client";

import { useState } from "react";
import { useVendorTrust } from "@/app/hooks/useVendorTrust";

export default function VendorsDashboardPage() {
  const [vendorIdInput, setVendorIdInput] = useState("");
  const [activeVendorId, setActiveVendorId] = useState("");
  const [badge, setBadge] = useState<string>("none");
  const { loading, data, error, refresh, update, getBadge } =
    useVendorTrust(activeVendorId);

  async function handleGetBadge() {
    const result = await getBadge();
    if (result && result.ok) {
      setBadge(result.badge);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Vendor Trust</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={vendorIdInput}
            onChange={(event) => setVendorIdInput(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="Vendor ID"
          />
          <button
            type="button"
            onClick={() => setActiveVendorId(vendorIdInput.trim())}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-2 text-sm font-medium"
          >
            Load Vendor
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="border-lh-border rounded-lg border px-3 py-2 text-sm font-medium"
          >
            Compute
          </button>
          <button
            type="button"
            onClick={() => update()}
            className="border-lh-border rounded-lg border px-3 py-2 text-sm font-medium"
          >
            Update Stored Score
          </button>
          <button
            type="button"
            onClick={handleGetBadge}
            className="border-lh-border rounded-lg border px-3 py-2 text-sm font-medium"
          >
            Get Badge
          </button>
        </div>
        <p className="text-lh-muted text-sm">
          {loading ? "Computing trust..." : (error ?? `Badge: ${badge}`)}
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
