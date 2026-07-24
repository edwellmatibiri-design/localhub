"use client";

import Link from "next/link";
import { useVendorTrust } from "@/app/hooks/useVendorTrust";

type VendorRow = {
  id: string;
  business_name: string;
  contact_email: string | null;
  trust_score: number;
};

function VendorActions({ vendorId }: { vendorId: string }) {
  const { update, loading } = useVendorTrust(vendorId);

  return (
    <div className="flex gap-2">
      <Link
        href={`/vendors/dashboard?vendorId=${vendorId}`}
        className="border-lh-border rounded border px-3 py-1"
      >
        View vendor dashboard
      </Link>
      <button
        type="button"
        onClick={() => update()}
        disabled={loading}
        className="bg-lh-accent text-lh-on-accent rounded px-3 py-1 disabled:opacity-60"
      >
        Recompute trust score
      </button>
    </div>
  );
}

export default function AdminVendorsClient({
  vendors,
}: {
  vendors: VendorRow[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Vendors</h2>
      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Business Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Trust Score</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-lh-border border-t">
                <td className="px-3 py-2">{vendor.business_name}</td>
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {vendor.contact_email ?? "-"}
                </td>
                <td className="px-3 py-2">{Math.round(vendor.trust_score)}</td>
                <td className="px-3 py-2">
                  <VendorActions vendorId={vendor.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
