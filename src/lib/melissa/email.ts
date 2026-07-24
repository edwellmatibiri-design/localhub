// Melissa drafts emails and summaries (wire to actual email/WhatsApp sending)
export function draftVendorPayoutIssueEmail(
  vendorName: string,
  issueSummary: string,
) {
  return {
    subject: "Update on your payout",
    body: `
Hi ${vendorName},

We've detected an issue affecting your recent payout:

${issueSummary}

Our team is investigating and we'll update you as soon as it's resolved.
  Thank you for your patience and for working with LocalHub Marketplace.

Best,
Melissa
  LocalHub Marketplace Support
    `.trim(),
  };
}

export function draftEddieAlertEmail(
  alertSummary: string,
  recommendedActions: string[],
) {
  return {
    subject: "URGENT - System Alert from Melissa",
    body: `
Hi Eddie,

Here's a critical issue that needs your attention:

${alertSummary}

Recommended actions:
${recommendedActions.map((a) => `- ${a}`).join("\n")}

I'll continue monitoring and can prepare follow-up communication if needed.

Melissa
  LocalHub Marketplace
    `.trim(),
  };
}

export function draftVendorReminderEmail(vendorName: string, reason: string) {
  return {
    subject: "Reminder from LocalHub",
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

export function draftComplianceReminderEmail(userName: string) {
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

export function draftWhatsAppAlertMessage(alertSummary: string) {
  return `
  URGENT - Melissa Alert from LocalHub Marketplace

${alertSummary}

Reply if you want me to prepare follow-up actions.
  `.trim();
}
