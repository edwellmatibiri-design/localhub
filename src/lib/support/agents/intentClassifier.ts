export type IntentResult = {
  userType: "vendor" | "user";
  category:
    | "booking"
    | "payment"
    | "quote"
    | "payout"
    | "ranking"
    | "cancellation"
    | "dispute"
    | "profile"
    | "tutorial"
    | "general";
  severity: "high" | "normal";
  escalate: boolean;
};

export function classifyIntent(message: string): IntentResult {
  message = message.toLowerCase();

  const userType =
    message.includes("vendor") ||
    message.includes("quote") ||
    message.includes("ranking") ||
    message.includes("payout")
      ? "vendor"
      : "user";

  const category = (() => {
    if (message.includes("book") || message.includes("booking"))
      return "booking";
    if (message.includes("payment") || message.includes("pay"))
      return "payment";
    if (message.includes("quote")) return "quote";
    if (message.includes("payout")) return "payout";
    if (message.includes("ranking")) return "ranking";
    if (message.includes("cancel")) return "cancellation";
    if (message.includes("dispute")) return "dispute";
    if (message.includes("profile")) return "profile";
    if (message.includes("tutorial") || message.includes("how to"))
      return "tutorial";
    return "general";
  })();

  const severity =
    message.includes("urgent") ||
    message.includes("help now") ||
    message.includes("immediately")
      ? "high"
      : "normal";

  const escalate =
    message.includes("refund") ||
    message.includes("legal") ||
    message.includes("breach") ||
    message.includes("payout issue");

  return { userType, category, severity, escalate };
}
