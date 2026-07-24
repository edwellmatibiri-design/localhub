"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import { InvoiceStatusButton } from "@/components/business/InvoiceActions";
import {
  DocumentDeleteButton,
  DocumentDownloadButton,
} from "@/components/business/DocumentActions";

type InvoiceRow = {
  id: number;
  vendor_id: string;
  user_id: string;
  invoice_number: string;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  created_at: string;
};

type DocumentRow = {
  id: number;
  vendor_id: string;
  name: string;
  type: "contract" | "job_sheet" | "other";
  created_at: string;
};

export default async function AdminBusinessSuitePage() {
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([]);
  const [documentRows, setDocumentRows] = useState<DocumentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const supabase = createClient();
      const [
        { data: invoices, error: invoicesError },
        { data: documents, error: documentsError },
      ] = await Promise.all([
        supabase
          .from("invoices")
          .select(
            "id, vendor_id, user_id, invoice_number, total, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("documents")
          .select("id, vendor_id, name, type, created_at")
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

      if (invoicesError) throw invoicesError;
      if (documentsError) throw documentsError;

      setInvoiceRows((invoices ?? []) as InvoiceRow[]);
      setDocumentRows((documents ?? []) as DocumentRow[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load business suite oversight",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totalInvoices = invoiceRows.length;
  const overdueInvoices = invoiceRows.filter(
    (invoice) => invoice.status === "overdue",
  ).length;
  const documentsUploaded = documentRows.length;
  const contractsGenerated = documentRows.filter(
    (doc) => doc.type === "contract",
  ).length;

  const vendorActivity = useMemo(() => {
    const map = new Map<
      string,
      { invoices: number; documents: number; contracts: number }
    >();
    invoiceRows.forEach((invoice) => {
      const key = String(invoice.vendor_id);
      const current = map.get(key) ?? {
        invoices: 0,
        documents: 0,
        contracts: 0,
      };
      current.invoices += 1;
      map.set(key, current);
    });

    documentRows.forEach((doc) => {
      const key = String(doc.vendor_id);
      const current = map.get(key) ?? {
        invoices: 0,
        documents: 0,
        contracts: 0,
      };
      current.documents += 1;
      if (doc.type === "contract") current.contracts += 1;
      map.set(key, current);
    });

    return map;
  }, [invoiceRows, documentRows]);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Business Suite Oversight</h1>
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Total invoices</p>
          <p className="text-xl font-semibold">{totalInvoices}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Overdue invoices</p>
          <p className="text-xl font-semibold">{overdueInvoices}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Documents uploaded</p>
          <p className="text-xl font-semibold">{documentsUploaded}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Contracts generated</p>
          <p className="text-xl font-semibold">{contractsGenerated}</p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Invoices</h2>
        {invoiceRows.length === 0 ? (
          <p className="text-lh-muted text-sm">No invoices found.</p>
        ) : (
          invoiceRows.map((invoice) => (
            <article
              key={invoice.id}
              className="border-lh-border space-y-2 rounded border p-3"
            >
              <p className="font-medium">{invoice.invoice_number}</p>
              <p className="text-lh-muted text-xs">
                Vendor: {invoice.vendor_id} | User: {invoice.user_id}
              </p>
              <p className="text-lh-muted text-xs">
                Status: {invoice.status} | Total: R{" "}
                {Number(invoice.total).toLocaleString("en-ZA")}
              </p>
              <div className="flex gap-2">
                <InvoiceStatusButton
                  invoiceId={invoice.id}
                  action="mark_paid"
                  label="Force mark paid"
                  onDone={() => void load()}
                />
              </div>
            </article>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Documents</h2>
        {documentRows.length === 0 ? (
          <p className="text-lh-muted text-sm">No documents found.</p>
        ) : (
          documentRows.map((doc) => (
            <article
              key={doc.id}
              className="border-lh-border flex flex-wrap items-center justify-between gap-2 rounded border p-3"
            >
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-lh-muted text-xs">
                  Vendor: {doc.vendor_id} | Type: {doc.type}
                </p>
              </div>
              <div className="flex gap-2">
                <DocumentDownloadButton documentId={doc.id} />
                <DocumentDeleteButton
                  documentId={doc.id}
                  onDone={() => void load()}
                />
              </div>
            </article>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Vendor Paperwork Activity</h2>
        {Array.from(vendorActivity.entries()).length === 0 ? (
          <p className="text-lh-muted text-sm">
            No vendor paperwork activity yet.
          </p>
        ) : (
          Array.from(vendorActivity.entries()).map(([vendorId, stats]) => (
            <article
              key={vendorId}
              className="border-lh-border grid gap-1 rounded border p-3 text-sm md:grid-cols-4"
            >
              <p className="font-medium">{vendorId}</p>
              <p className="text-lh-muted">Invoices: {stats.invoices}</p>
              <p className="text-lh-muted">Documents: {stats.documents}</p>
              <p className="text-lh-muted">Contracts: {stats.contracts}</p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
