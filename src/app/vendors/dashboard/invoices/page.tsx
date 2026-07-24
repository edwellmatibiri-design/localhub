"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import {
  InvoiceEditButton,
  InvoicePdfButton,
  InvoiceStatusButton,
} from "@/components/business/InvoiceActions";

type InvoiceRow = {
  id: number;
  vendor_id: string;
  user_id: string;
  booking_id: number | null;
  invoice_number: string;
  items: Array<{ description: string; qty: number; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  created_at: string;
  updated_at: string;
};

export default function VendorInvoicesPage() {
  const [vendorId, setVendorId] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const queryVendorId =
        new URLSearchParams(window.location.search).get("vendorId") ?? "";
      let activeVendorId = queryVendorId;
      if (!activeVendorId) {
        const { data: profile } = await supabase
          .from("seller_profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        activeVendorId = String(profile?.id ?? "");
      }

      setVendorId(activeVendorId);
      if (!activeVendorId) {
        setInvoices([]);
        return;
      }

      const { data, error: invoicesError } = await supabase
        .from("invoices")
        .select(
          "id, vendor_id, user_id, booking_id, invoice_number, items, subtotal, tax, total, status, created_at, updated_at",
        )
        .eq("vendor_id", activeVendorId)
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices((data ?? []) as InvoiceRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    return {
      draft: invoices.filter((invoice) => invoice.status === "draft"),
      sent: invoices.filter((invoice) => invoice.status === "sent"),
      paid: invoices.filter((invoice) => invoice.status === "paid"),
      overdue: invoices.filter((invoice) => invoice.status === "overdue"),
    };
  }, [invoices]);

  async function createInvoice() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          userId: "unknown-user",
          items: [
            { description: "Service fee", qty: 1, price: 1000 },
            { description: "Callout", qty: 1, price: 350 },
          ],
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to create invoice"));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Vendor Invoices</h1>
          <p className="text-lh-muted text-sm">
            Vendor: {vendorId || "Not selected"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void createInvoice()}
          disabled={!vendorId || creating}
          className="bg-lh-accent text-lh-on-accent rounded px-4 py-2 text-sm disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create invoice"}
        </button>
      </div>

      {loading && (
        <p className="card text-lh-muted text-sm">Loading invoices...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading &&
        (["draft", "sent", "paid", "overdue"] as const).map((status) => (
          <section key={status} className="space-y-2">
            <h2 className="text-lg font-semibold capitalize">
              {status} invoices
            </h2>
            {grouped[status].length === 0 ? (
              <div className="card">
                <p className="text-lh-muted text-sm">No {status} invoices.</p>
              </div>
            ) : (
              grouped[status].map((invoice) => (
                <article key={invoice.id} className="card space-y-2">
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <p className="text-lh-muted text-xs">
                    User: {invoice.user_id} | Booking:{" "}
                    {invoice.booking_id ?? "-"}
                  </p>
                  <div className="text-lh-muted grid gap-2 text-sm md:grid-cols-4">
                    <p>
                      Subtotal: R{" "}
                      {Number(invoice.subtotal).toLocaleString("en-ZA")}
                    </p>
                    <p>Tax: R {Number(invoice.tax).toLocaleString("en-ZA")}</p>
                    <p>
                      Total: R {Number(invoice.total).toLocaleString("en-ZA")}
                    </p>
                    <p>
                      Updated: {new Date(invoice.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <InvoiceEditButton
                      invoiceId={invoice.id}
                      onDone={() => window.location.reload()}
                    />
                    <InvoiceStatusButton
                      invoiceId={invoice.id}
                      action="send"
                      label="Send invoice"
                      onDone={() => window.location.reload()}
                    />
                    <InvoiceStatusButton
                      invoiceId={invoice.id}
                      action="mark_paid"
                      label="Mark paid"
                      onDone={() => window.location.reload()}
                    />
                    <InvoicePdfButton invoiceId={invoice.id} />
                  </div>
                </article>
              ))
            )}
          </section>
        ))}
    </section>
  );
}
