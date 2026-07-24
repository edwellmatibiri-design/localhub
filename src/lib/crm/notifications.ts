import type { CrmPipelineRow } from "@/lib/crm/pipeline";
import { calculateVendorForecastRevenue } from "@/lib/crm/forecast";

const DAY = 24 * 60 * 60 * 1000;

export function buildCrmNotifications(items: CrmPipelineRow[]) {
  const now = Date.now();
  const notifications: string[] = [];

  const idleLead = items.find(
    (item) =>
      item.stage === "new_lead" && now - Date.parse(item.updated_at) >= DAY,
  );
  if (idleLead) {
    notifications.push(
      `Lead has been idle for 24 hours (pipeline #${idleLead.id}).`,
    );
  }

  const quoteAwaiting = items.find(
    (item) =>
      item.stage === "quote_sent" && now - Date.parse(item.updated_at) >= DAY,
  );
  if (quoteAwaiting) {
    notifications.push(
      `Quote awaiting follow-up (pipeline #${quoteAwaiting.id}).`,
    );
  }

  const highValueNegotiation = items.find(
    (item) =>
      item.stage === "negotiation" && Number(item.value_estimate) >= 10000,
  );
  if (highValueNegotiation) {
    notifications.push(
      `High-value lead in negotiation (pipeline #${highValueNegotiation.id}).`,
    );
  }

  const weightedRecent = calculateVendorForecastRevenue(
    items.filter((item) => now - Date.parse(item.updated_at) <= DAY),
  );
  if (weightedRecent > 0) {
    notifications.push(
      `Pipeline value increased (weighted +R ${Math.round(weightedRecent).toLocaleString("en-ZA")}).`,
    );
  }

  return notifications;
}
