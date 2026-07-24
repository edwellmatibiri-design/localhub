type EscalationTicket = {
  ticketId: string;
  userId: string;
  category: string;
  severity: string;
  message: string;
  createdAt: string;
};

export function escalateIssue(
  userId: string,
  category: string,
  message: string,
  severity: string,
): EscalationTicket {
  return {
    ticketId: crypto.randomUUID(),
    userId,
    category,
    severity,
    message,
    createdAt: new Date().toISOString(),
  };
}
