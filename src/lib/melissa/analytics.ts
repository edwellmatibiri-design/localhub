import type {
  ComplianceMetrics,
  HealthMetrics,
  OpsReport,
  TicketSummary,
} from "./models";

// Melissa's ops report generator
export async function generateOpsReport(
  ticketSummary: TicketSummary,
  health: HealthMetrics,
  compliance: ComplianceMetrics,
): Promise<OpsReport> {
  return {
    headline: "Daily Ops Summary",
    highlights: [
      `Total tickets: ${ticketSummary.total} (${ticketSummary.highPriority} high priority)`,
      `Booking success rate: ${(health.bookingSuccessRate * 100).toFixed(1)}%`,
      `Payout success rate: ${(health.payoutSuccessRate * 100).toFixed(1)}%`,
      `POPIA acceptance coverage: ${(compliance.popiaAcceptanceCoverage * 100).toFixed(1)}%`,
      `Vendor verification coverage: ${(compliance.vendorVerificationCoverage * 100).toFixed(1)}%`,
    ],
  };
}
