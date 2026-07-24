import { draftEddieAlertEmail } from "./email";
import type {
  ComplianceMetrics,
  EddieAlertPayload,
  HealthMetrics,
  MelissaAlert,
  TicketSummary,
} from "./models";

export async function detectCriticalIssues(
  ticketSummary: TicketSummary,
  health: HealthMetrics,
  compliance: ComplianceMetrics | null,
): Promise<MelissaAlert[]> {
  const alerts: MelissaAlert[] = [];

  if (ticketSummary.highPriority > 5) {
    alerts.push({
      type: "support_load",
      summary: `High number of high-priority tickets: ${ticketSummary.highPriority}`,
      recommendedActions: [
        "Review payout and booking tickets",
        "Consider temporary manual intervention for payouts",
      ],
    });
  }

  if (health.status === "degraded") {
    alerts.push({
      type: "system_health",
      summary: "System health degraded (errors or payout issues detected).",
      recommendedActions: [
        "Check payment provider status",
        "Review error logs",
        "Pause non-critical changes",
      ],
    });
  }

  if (compliance && compliance.status === "attention") {
    alerts.push({
      type: "compliance",
      summary:
        "Compliance coverage below target (POPIA or vendor verification).",
      recommendedActions: [
        "Trigger compliance reminder campaign",
        "Review high-volume non-compliant vendors",
      ],
    });
  }

  return alerts;
}

export function buildEddieAlertPayload(alert: MelissaAlert): EddieAlertPayload {
  const email = draftEddieAlertEmail(alert.summary, alert.recommendedActions);
  return {
    channel: "email",
    email,
  };
}
