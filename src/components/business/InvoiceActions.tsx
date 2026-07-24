"use client";

import { useState } from "react";

export function InvoiceStatusButton({
  invoiceId,
  action,
  label,
  onDone,
}: {
  invoiceId: number;
  action: "send" | "mark_paid" | "mark_overdue";
  label: string;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/invoices/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed"));
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Working..." : label}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function InvoiceEditButton({
  invoiceId,
  onDone,
}: {
  invoiceId: number;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const items = [
        { description: "Updated service line", qty: 1, price: 500 },
        { description: "Parts", qty: 1, price: 250 },
      ];
      const response = await fetch("/api/invoices/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action: "edit", items }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed"));
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Working..." : "Edit invoice"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function InvoicePdfButton({ invoiceId }: { invoiceId: number }) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const response = await fetch("/api/invoices/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={loading}
      className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
    >
      {loading ? "Preparing..." : "Download PDF"}
    </button>
  );
}
