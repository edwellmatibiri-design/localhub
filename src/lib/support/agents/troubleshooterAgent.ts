const flows: Record<string, string[]> = {
  booking: [
    "Check if the vendor is available",
    "Check if your profile is complete",
    "Check if your payment method is valid",
    "Try again",
  ],
  payout: [
    "Check if your banking details are verified",
    "Check if the job is marked completed",
    "Check payout schedule",
    "If still stuck -> escalate",
  ],
};

export function troubleshoot(category: string) {
  return flows[category] || ["No troubleshooting flow available."];
}
