"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";
import Link from "next/link";

type DisputeRow = {
  id: number;
  booking_id: number;
  user_id: string;
  vendor_id: string;
  reason: string;
  status: "open" | "under_review" | "resolved" | "rejected";
  resolution: string | null;
  created_at: string;
};

export default function VendorDisputesPage() {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const fromQuery =
          new URLSearchParams(window.location.search).get("vendorId") ?? "";
        let vendorId = fromQuery;

        if (!vendorId) {
          const { data: vendor } = await supabase
            .from("seller_profiles")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          vendorId = String(vendor?.id ?? "");
        }

        if (!vendorId) {
          setRows([]);
          return;
        }

        const { data, error: disputesError } = await supabase
          .from("disputes")
          .select(
            "id, booking_id, user_id, vendor_id, reason, status, resolution, created_at",
          )
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false });

        if (disputesError) throw disputesError;
        setRows((data ?? []) as DisputeRow[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load disputes",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Disputes</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading disputes...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && rows.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No disputes yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="card space-y-2">
              <p className="font-medium">Dispute #{row.id}</p>
              <p className="text-lh-muted text-sm">Booking: {row.booking_id}</p>
              <p className="text-lh-muted text-sm">Reason: {row.reason}</p>
              <p className="text-lh-muted text-sm">
                Status: <span className="capitalize">{row.status}</span>
              </p>
              {row.resolution && (
                <p className="text-lh-muted text-sm">
                  Resolution: {row.resolution}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(row.vendor_id)}&prompt=${encodeURIComponent(`Help me handle dispute #${row.id} professionally. Reason: ${row.reason}`)}`}
                  className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                >
                  Help me handle dispute
                </Link>
                <Link
                  href={`/vendors/dashboard/ai?vendorId=${encodeURIComponent(row.vendor_id)}&prompt=${encodeURIComponent(`Draft a professional evidence-based reply for dispute #${row.id}`)}`}
                  className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                >
                  Draft response
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
