import { summarizeTickets } from "./support";
import { generateOpsReport } from "./analytics";
import { runHealthChecks } from "./health";
import { checkCompliance } from "./compliance";
import { detectCriticalIssues } from "./escalation";
import {
  closeTicket,
  triggerPayoutRecheck,
  sendVendorReminder,
  triggerComplianceReminder,
  reassignTicket,
  flagVendor,
} from "./actions";
import { logMelissaAction } from "./memory";
import type {
  ComplianceMetrics,
  HealthMetrics,
  MelissaAlert,
  TicketSummary,
} from "./models";
import { sb } from "@/lib/supabase/serverClient";
import { melissaEscalate } from "./comms/escalate";

export async function runMelissaDaily(_userId: string) {
  const ticketSummary = await summarizeTickets();
  const health = await runHealthChecks();
  const compliance = await checkCompliance();
  const opsReport = await generateOpsReport(ticketSummary, health, compliance);
  const alerts = await detectCriticalIssues(ticketSummary, health, compliance);

  await runSelfHealing(ticketSummary, health, compliance);

  await persistMelissaReport(opsReport.headline, opsReport.highlights);
  await sendEscalations(alerts);

  await runAutonomousActions(ticketSummary, health, compliance, alerts);

  return {
    ticketSummary,
    health,
    compliance,
    opsReport,
    alerts,
  };
}

export async function runMelissaHourly(_userId: string) {
  const ticketSummary = await summarizeTickets({ recentOnly: true });
  const health = await runHealthChecks({ shallow: true });
  const alerts = await detectCriticalIssues(ticketSummary, health, null);

  await sendEscalations(alerts);

  await runAutonomousActions(ticketSummary, health, null, alerts);

  return {
    ticketSummary,
    health,
    alerts,
  };
}

export async function runMelissaWeekly(userId: string) {
  // Weekly routine currently reuses full daily checks and actions.
  return runMelissaDaily(userId);
}

async function runAutonomousActions(
  ticketSummary: TicketSummary,
  health: HealthMetrics,
  compliance: ComplianceMetrics | null,
  alerts: MelissaAlert[],
) {
  if (ticketSummary.byType?.payout && ticketSummary.byType.payout > 0) {
    const batchInfo = { count: ticketSummary.byType.payout };
    await logMelissaAction("payout_recheck_batch", batchInfo);

    const payoutTicket = ticketSummary.tickets.find(
      (t) => t.type === "payout" && t.vendorId,
    );
    if (payoutTicket?.vendorId) {
      const recheckResult = await triggerPayoutRecheck(payoutTicket.vendorId);
      await logMelissaAction("payout_recheck_triggered", recheckResult);
    }
  }

  const highPriorityTicket = ticketSummary.tickets.find(
    (t) => t.severity === "high",
  );
  if (highPriorityTicket) {
    const reassigned = await reassignTicket(
      String(highPriorityTicket.id),
      "ops-priority-queue",
    );
    await logMelissaAction("ticket_reassigned", reassigned);

    if (highPriorityTicket.vendorId) {
      const reminder = await sendVendorReminder(
        highPriorityTicket.vendorId,
        `Ticket ${highPriorityTicket.id} requires urgent input`,
      );
      await logMelissaAction("vendor_reminder_sent", reminder);
    }
  }

  if (compliance && compliance.status === "attention") {
    await logMelissaAction("compliance_reminder_batch", {
      status: compliance.status,
    });

    const complianceTicket = ticketSummary.tickets.find((t) => t.userId);
    if (complianceTicket?.userId) {
      const complianceReminder = await triggerComplianceReminder(
        complianceTicket.userId,
      );
      await logMelissaAction(
        "compliance_reminder_triggered",
        complianceReminder,
      );
    }
  }

  if (health.status === "degraded") {
    const ticketWithVendor = ticketSummary.tickets.find((t) => t.vendorId);
    if (ticketWithVendor?.vendorId) {
      const flagged = await flagVendor(
        ticketWithVendor.vendorId,
        "Automated degraded-health safeguard",
      );
      await logMelissaAction("vendor_flagged", flagged);
    }
  }

  if (alerts.length === 0 && highPriorityTicket) {
    const closed = await closeTicket(String(highPriorityTicket.id));
    await logMelissaAction("ticket_closed", closed);
  }

  for (const alert of alerts) {
    await logMelissaAction("alert_detected", alert);
  }
}

async function persistMelissaReport(headline: string, highlights: string[]) {
  await sb().from("melissa_reports").insert({
    headline,
    highlights,
    created_at: new Date().toISOString(),
  });
}

async function sendEscalations(alerts: MelissaAlert[]) {
  for (const alert of alerts) {
    await melissaEscalate(alert);
    await logMelissaAction("escalation_sent", alert);
  }
}

async function runSelfHealing(
  ticketSummary: TicketSummary,
  health: HealthMetrics,
  compliance: ComplianceMetrics,
) {
  if (health.payoutSuccessRate < 0.9) {
    await logMelissaAction("self_heal_payout_recheck_batch", {
      payoutSuccessRate: health.payoutSuccessRate,
    });

    const vendorIds = Array.from(
      new Set(
        ticketSummary.tickets
          .filter((t) => t.type === "payout" && t.vendorId)
          .map((t) => String(t.vendorId)),
      ),
    );
    for (const vendorId of vendorIds.slice(0, 20)) {
      await triggerPayoutRecheck(vendorId);
    }
  }

  if (compliance.status === "attention") {
    await logMelissaAction("self_heal_compliance_reminder_batch", {
      popiaAcceptanceCoverage: compliance.popiaAcceptanceCoverage,
      vendorVerificationCoverage: compliance.vendorVerificationCoverage,
    });

    const userIds = Array.from(
      new Set(
        ticketSummary.tickets
          .filter((t) => t.userId)
          .map((t) => String(t.userId)),
      ),
    );
    for (const userId of userIds.slice(0, 20)) {
      await triggerComplianceReminder(userId);
    }
  }
}
