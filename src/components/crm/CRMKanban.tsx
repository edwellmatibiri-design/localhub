"use client";

import { useMemo, useState } from "react";
import type { CrmPipelineRow, CrmStage } from "@/lib/crm/pipeline";

const COLUMNS: Array<{ stage: CrmStage; title: string }> = [
  { stage: "new_lead", title: "New Leads" },
  { stage: "contacted", title: "Contacted" },
  { stage: "quote_sent", title: "Quote Sent" },
  { stage: "negotiation", title: "Negotiation" },
  { stage: "awaiting_payment", title: "Awaiting Payment" },
  { stage: "booked", title: "Booked" },
  { stage: "completed", title: "Completed" },
  { stage: "lost", title: "Lost" },
];

export default function CRMKanban({
  vendorId,
  initialItems,
}: {
  vendorId: string;
  initialItems: CrmPipelineRow[];
}) {
  const [items, setItems] = useState<CrmPipelineRow[]>(initialItems);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<CrmStage, CrmPipelineRow[]>();
    COLUMNS.forEach((column) => map.set(column.stage, []));
    items.forEach((item) => {
      const list = map.get(item.stage) ?? [];
      list.push(item);
      map.set(item.stage, list);
    });
    return map;
  }, [items]);

  async function moveCard(itemId: number, nextStage: CrmStage) {
    const item = items.find((row) => row.id === itemId);
    if (!item || item.stage === nextStage) return;

    setUpdatingId(itemId);
    setError(null);

    const previous = [...items];
    setItems((current) =>
      current.map((row) =>
        row.id === itemId
          ? { ...row, stage: nextStage, updated_at: new Date().toISOString() }
          : row,
      ),
    );

    try {
      const response = await fetch("/api/crm/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          leadId: item.lead_id,
          quoteId: item.quote_id,
          bookingId: item.booking_id,
          stage: nextStage,
          valueEstimate: item.value_estimate,
          probability: item.probability,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to move pipeline item"),
        );
      }
    } catch (err) {
      setItems(previous);
      setError(
        err instanceof Error ? err.message : "Failed to move pipeline item",
      );
    } finally {
      setUpdatingId(null);
      setDraggingId(null);
    }
  }

  return (
    <section className="space-y-3">
      {error && <p className="card text-lh-danger text-sm">{error}</p>}
      <div className="grid gap-3 lg:grid-cols-4 2xl:grid-cols-8">
        {COLUMNS.map((column) => {
          const columnItems = grouped.get(column.stage) ?? [];
          return (
            <div
              key={column.stage}
              className="border-lh-border bg-lh-surface/80 rounded-lg border p-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const itemId = Number(event.dataTransfer.getData("text/plain"));
                if (Number.isFinite(itemId) && itemId > 0) {
                  void moveCard(itemId, column.stage);
                }
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{column.title}</h3>
                <span className="text-lh-muted text-xs">
                  {columnItems.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnItems.map((item) => (
                  <article
                    key={item.id}
                    draggable={updatingId !== item.id}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", String(item.id));
                      setDraggingId(item.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className="border-lh-border bg-lh-surface rounded border p-2 text-xs"
                  >
                    <p className="font-medium">Pipeline #{item.id}</p>
                    <p className="text-lh-muted">
                      Value: R{" "}
                      {Number(item.value_estimate).toLocaleString("en-ZA")}
                    </p>
                    <p className="text-lh-muted">
                      Probability: {item.probability}%
                    </p>
                    <p className="text-lh-muted">
                      Updated: {new Date(item.updated_at).toLocaleString()}
                    </p>
                    {draggingId === item.id && (
                      <p className="text-lh-accent">Dragging...</p>
                    )}
                    {updatingId === item.id && (
                      <p className="text-lh-accent">Updating stage...</p>
                    )}
                  </article>
                ))}
                {columnItems.length === 0 && (
                  <p className="border-lh-border text-lh-muted rounded border border-dashed p-2 text-xs">
                    Drop cards here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
