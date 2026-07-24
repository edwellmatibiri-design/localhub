export type TicketSeverity = "high" | "normal";

export type SupportTicket = {
  id: string;
  type: string;
  severity: TicketSeverity;
  vendorId?: string;
  userId?: string;
  message?: string;
  createdAt?: string;
};

export type TicketSummary = {
  total: number;
  highPriority: number;
  byType: Record<string, number>;
  tickets: SupportTicket[];
};

export type HealthStatus = "healthy" | "degraded";

export type HealthMetrics = {
  bookingSuccessRate: number;
  payoutSuccessRate: number;
  errorRate: number;
  status: HealthStatus;
};

export type ComplianceStatus = "ok" | "attention";

export type ComplianceMetrics = {
  popiaAcceptanceCoverage: number;
  vendorVerificationCoverage: number;
  status: ComplianceStatus;
};

export type OpsReport = {
  headline: string;
  highlights: string[];
};

export type MelissaAlert = {
  type: string;
  summary: string;
  recommendedActions: string[];
};

export type EddieAlertPayload = {
  channel: "email";
  email: {
    subject: string;
    body: string;
  };
};

export type MelissaLogEntry = {
  id: string;
  actionType: string;
  payload: unknown;
  timestamp: string;
};
