import { sb } from "@/lib/supabase/serverClient";
import type { SupportTicket, TicketSummary } from "./models";

export async function summarizeTickets(
  options: { recentOnly?: boolean } = {},
): Promise<TicketSummary> {
  let query = sb()
    .from("support_tickets")
    .select("id, type, severity, vendor_id, user_id, message, created_at");

  if (options.recentOnly) {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    query = query.gte("created_at", oneHourAgo);
  }

  const { data } = await query;
  const tickets: SupportTicket[] = (data ?? []).map((ticket) => ({
    id: String(ticket.id),
    type: String(ticket.type ?? "general"),
    severity: ticket.severity === "high" ? "high" : "normal",
    vendorId: ticket.vendor_id ? String(ticket.vendor_id) : undefined,
    userId: ticket.user_id ? String(ticket.user_id) : undefined,
    message: ticket.message ? String(ticket.message) : undefined,
    createdAt: ticket.created_at ? String(ticket.created_at) : undefined,
  }));

  const total = tickets.length;
  const highPriority = tickets.filter((t) => t.severity === "high").length;

  const byType = tickets.reduce(
    (acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total,
    highPriority,
    byType,
    tickets,
  };
}
