import type { CrmPipelineEventRow, CrmPipelineRow } from "@/lib/crm/pipeline";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function computeCrmAnalytics(
  items: CrmPipelineRow[],
  events: CrmPipelineEventRow[],
) {
  const stageCounts = new Map<string, number>();
  items.forEach((item) => {
    stageCounts.set(item.stage, (stageCounts.get(item.stage) ?? 0) + 1);
  });

  const newLeads = stageCounts.get("new_lead") ?? 0;
  const completed = stageCounts.get("completed") ?? 0;
  const quoteSent = stageCounts.get("quote_sent") ?? 0;
  const booked = (stageCounts.get("booked") ?? 0) + completed;

  const conversionRate = newLeads > 0 ? completed / newLeads : 0;
  const quoteToBookingRate = quoteSent > 0 ? booked / quoteSent : 0;

  const eventsByPipeline = new Map<number, CrmPipelineEventRow[]>();
  for (const event of events) {
    const key = Number(event.pipeline_id);
    const list = eventsByPipeline.get(key) ?? [];
    list.push(event);
    eventsByPipeline.set(key, list);
  }

  const negotiationHours: number[] = [];
  eventsByPipeline.forEach((pipelineEvents) => {
    const sorted = [...pipelineEvents].sort(
      (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
    );
    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index];
      if (current.to_stage !== "negotiation") continue;

      const next = sorted
        .slice(index + 1)
        .find(
          (event) =>
            event.from_stage === "negotiation" ||
            event.to_stage !== "negotiation",
        );
      if (!next) continue;

      const ms = Date.parse(next.created_at) - Date.parse(current.created_at);
      if (ms > 0) {
        negotiationHours.push(ms / (1000 * 60 * 60));
      }
    }
  });

  const leadResponseHours: number[] = [];
  const leadStartByKey = new Map<string, string>();

  const sortedEvents = [...events].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );
  for (const event of sortedEvents) {
    const leadId = Number(event.metadata?.leadId);
    if (!Number.isFinite(leadId) || leadId <= 0) continue;

    const key = `${event.vendor_id}:${leadId}`;
    if (event.to_stage === "new_lead" && !leadStartByKey.has(key)) {
      leadStartByKey.set(key, event.created_at);
      continue;
    }

    if (event.to_stage === "contacted" && leadStartByKey.has(key)) {
      const startedAt = leadStartByKey.get(key);
      const ms = Date.parse(event.created_at) - Date.parse(String(startedAt));
      if (ms > 0) {
        leadResponseHours.push(ms / (1000 * 60 * 60));
      }
    }
  }

  return {
    conversionRate,
    quoteToBookingRate,
    averageNegotiationTimeHours: average(negotiationHours),
    averageLeadResponseTimeHours: average(leadResponseHours),
    stageCounts,
  };
}
