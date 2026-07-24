import { predictUserIntent } from "@/lib/ai/intentPredictor";

export type SmartNotification = {
  type: string;
  message: string;
};

export function buildSmartNotifications(input: {
  nowIso?: string;
  leadWaitMinutes: number;
  quoteAgeHours: number;
  bookingTomorrow: boolean;
  recentSearches: string[];
  recentMessages: string[];
  categoryClicks: string[];
}) {
  const notifications: SmartNotification[] = [];

  if (input.leadWaitMinutes >= 30) {
    notifications.push({
      type: "vendor_no_response_follow_up",
      message: "Vendor hasn't responded — want me to follow up?",
    });
  }

  if (input.quoteAgeHours >= 24) {
    notifications.push({
      type: "quote_expiring_reminder",
      message: "Your quote is expiring — want me to remind the vendor?",
    });
  }

  if (input.bookingTomorrow) {
    notifications.push({
      type: "booking_tomorrow_confirm",
      message: "Your booking is tomorrow — confirm details?",
    });
  }

  const predicted = predictUserIntent({
    recentSearches: input.recentSearches,
    recentMessages: input.recentMessages,
    categoryClicks: input.categoryClicks,
  });

  if (predicted.intent === "needs_help") {
    notifications.push({
      type: "needs_help_assist",
      message: "Want me to help you complete your booking?",
    });
  }

  return {
    predictedIntent: predicted,
    notifications,
  };
}
