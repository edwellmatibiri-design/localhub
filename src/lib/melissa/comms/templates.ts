import type { MelissaAlert } from "../models";

export function vendorPayoutIssueTemplate(
  vendorName: string,
  issueSummary: string,
) {
  return {
    subject: "Update on your payout",
    body: `
Hi ${vendorName},

We've detected an issue affecting your recent payout:

${issueSummary}

Melissa is monitoring the situation and will notify you once resolved.

Best,
Melissa
LocalHub Marketplace
    `.trim(),
  };
}

export function vendorReminderTemplate(vendorName: string, reason: string) {
  return {
    subject: "Reminder from LocalHub Marketplace",
    body: `
Hi ${vendorName},

This is a quick reminder regarding:

${reason}

Please log into your LocalHub Marketplace dashboard to review and take action.

Best,
Melissa
LocalHub Marketplace
    `.trim(),
  };
}

export function userComplianceTemplate(userName: string) {
  return {
    subject: "Action required - Legal and POPIA compliance",
    body: `
Hi ${userName},

We've noticed that your legal or POPIA acceptance is incomplete.

Please log into your LocalHub Marketplace account and complete the required steps to stay compliant.

Best,
Melissa
LocalHub Marketplace
    `.trim(),
  };
}

export function eddieAlertTemplate(alert: MelissaAlert) {
  return {
    subject: `URGENT - Melissa Alert: ${alert.type}`,
    body: `
Hi Eddie,

Melissa detected a critical issue:

Summary:
${alert.summary}

Recommended actions:
${alert.recommendedActions.map((a) => `- ${a}`).join("\n")}

Timestamp: ${new Date().toISOString()}

Melissa will continue monitoring and can take follow-up actions if needed.
    `.trim(),
  };
}
