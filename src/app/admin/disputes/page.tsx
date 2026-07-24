"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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

export default function AdminDisputesPage() {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: disputesError } = await supabase
          .from("disputes")
          .select(
            "id, booking_id, user_id, vendor_id, reason, status, resolution, created_at",
          )
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

    void load();
  }, []);

  async function updateDispute(
    disputeId: number,
    status: "under_review" | "resolved" | "rejected",
  ) {
    const resolution = status === "resolved" ? "Resolved by admin" : undefined;
    try {
      const response = await fetch("/api/disputes/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, status, resolution }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to update dispute"));
      }

      setRows((current) =>
        current.map((row) =>
          row.id === disputeId
            ? {
                ...row,
                status,
                resolution:
                  status === "resolved" ? "Resolved by admin" : row.resolution,
              }
            : row,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update dispute");
    }
  }

  async function summarizeHistory() {
    if (rows.length === 0) {
      setAiSummary("No disputes available to summarize.");
      return;
    }

    setSummarizing(true);
    setError(null);
    try {
      const details = rows
        .slice(0, 30)
        .map(
          (row) =>
            `#${row.id} booking:${row.booking_id} status:${row.status} reason:${row.reason}`,
        )
        .join("\n");

      const response = await fetch("/api/ai/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "user",
          message: `Summarize dispute history for admin review and next actions:\n${details}`,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to summarize disputes"),
        );
      }

      setAiSummary(String(payload.reply ?? ""));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to summarize disputes",
      );
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <AppShell
      title="Disputes"
      subtitle="Vendor and user disputes, resolution status, and risk signals."
    >
      <Panel>
        <SectionHeader
          title="AI Dispute Intelligence"
          description="Summarize recent disputes and identify recommended interventions."
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-lh-text-secondary text-sm">
            Generate an executive summary of recent dispute activity.
          </p>
          <Button
            type="button"
            onClick={() => void summarizeHistory()}
            disabled={summarizing}
            variant="secondary"
          >
            {summarizing ? "Summarizing..." : "Summarize history"}
          </Button>
        </div>
        {aiSummary && (
          <p className="text-lh-text-secondary mt-3 text-sm whitespace-pre-wrap">
            {aiSummary}
          </p>
        )}
      </Panel>

      {loading && (
        <Panel>
          <p className="text-lh-text-secondary text-sm">Loading disputes...</p>
        </Panel>
      )}

      {error && (
        <Panel>
          <p className="text-lh-danger text-sm">{error}</p>
        </Panel>
      )}

      {!loading && (
        <Panel>
          <SectionHeader
            title="Recent Disputes"
            description="Monitor and resolve conflicts across the marketplace."
          />
          <Table
            columns={[
              "id",
              "booking",
              "user",
              "vendor",
              "reason",
              "status",
              "created_at",
              "actions",
            ]}
            rows={rows}
            renderCell={(row, col) => {
              const dispute = row as DisputeRow;
              switch (col) {
                case "id":
                  return dispute.id;
                case "booking":
                  return dispute.booking_id;
                case "user":
                  return dispute.user_id;
                case "vendor":
                  return dispute.vendor_id;
                case "reason":
                  return dispute.reason;
                case "status":
                  return (
                    <Badge
                      label={dispute.status}
                      tone={
                        dispute.status === "open"
                          ? "warning"
                          : dispute.status === "resolved"
                            ? "success"
                            : dispute.status === "rejected"
                              ? "danger"
                              : "default"
                      }
                    />
                  );
                case "created_at":
                  return new Date(dispute.created_at).toLocaleString();
                case "actions":
                  return (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          void updateDispute(dispute.id, "under_review")
                        }
                      >
                        Under review
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() =>
                          void updateDispute(dispute.id, "resolved")
                        }
                      >
                        Resolve
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() =>
                          void updateDispute(dispute.id, "rejected")
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  );
                default:
                  return "";
              }
            }}
          />
        </Panel>
      )}
    </AppShell>
  );
}
