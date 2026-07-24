"use client";

import { useState } from "react";

export function StatementGenerateButton({
  vendorId,
  periodStart,
  periodEnd,
  onDone,
}: {
  vendorId: string;
  periodStart: string;
  periodEnd: string;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/financial/statements/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, periodStart, periodEnd }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(
          String(payload?.error ?? "Failed to generate statement"),
        );
      if (onDone) {
        onDone();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate statement",
      );
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
        {loading ? "Generating..." : "Generate statement"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function TaxGenerateButton({
  vendorId,
  year,
  onDone,
}: {
  vendorId: string;
  year: number;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/financial/tax/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, year }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(
          String(payload?.error ?? "Failed to generate tax report"),
        );
      if (onDone) {
        onDone();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate tax report",
      );
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
        {loading ? "Generating..." : "Generate tax report"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export function StatementPdfButton({ statementId }: { statementId: number }) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const response = await fetch("/api/financial/statements/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId }),
      });
      if (!response.ok) {
        throw new Error("Failed to download statement PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement-${statementId}.pdf`;
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

export function TaxReportDownloadButton({
  report,
}: {
  report: {
    id: number;
    vendor_id: string;
    year: number;
    total_earnings: number;
    tax_estimate: number;
    created_at: string;
  };
}) {
  function run() {
    const payload = {
      reportId: report.id,
      vendorId: report.vendor_id,
      year: report.year,
      totalEarnings: report.total_earnings,
      taxEstimate: report.tax_estimate,
      generatedAt: report.created_at,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${report.year}-${report.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={run}
      className="border-lh-border rounded border px-3 py-1 text-xs"
    >
      Download report
    </button>
  );
}
