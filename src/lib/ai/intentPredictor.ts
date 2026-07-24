export type IntentPredictorInput = {
  recentSearches: string[];
  recentMessages: string[];
  categoryClicks: string[];
};

export type IntentPredictorOutput = {
  intent:
    | "ready_to_book"
    | "comparing_vendors"
    | "needs_help"
    | "price_sensitive"
    | "general";
  confidence: number;
};

function countByValue(items: string[]) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = String(item ?? "")
      .trim()
      .toLowerCase();
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
}

export function predictUserIntent(
  input: IntentPredictorInput,
): IntentPredictorOutput {
  const recentSearches = input.recentSearches ?? [];
  const recentMessages = input.recentMessages ?? [];
  const categoryClicks = input.categoryClicks ?? [];

  const searchCounts = countByValue(recentSearches);
  const maxSearchRepeat = Math.max(0, ...Array.from(searchCounts.values()));

  if (maxSearchRepeat >= 3) {
    return { intent: "ready_to_book", confidence: 0.82 };
  }

  const clickCounts = countByValue(categoryClicks);
  const repeatedVendorProfileViews =
    Math.max(0, ...Array.from(clickCounts.values())) >= 3;
  if (repeatedVendorProfileViews) {
    return { intent: "comparing_vendors", confidence: 0.78 };
  }

  const asksHelp = recentMessages.some((message) =>
    /help|not sure|confused|how to/i.test(String(message)),
  );
  const hasMessages = recentMessages.length >= 2;
  if (asksHelp || hasMessages) {
    return { intent: "needs_help", confidence: 0.72 };
  }

  const pricingSignals = [...recentSearches, ...recentMessages].some((item) =>
    /price|pricing|cost|cheap|budget|expensive/i.test(String(item)),
  );
  if (pricingSignals) {
    return { intent: "price_sensitive", confidence: 0.7 };
  }

  return { intent: "general", confidence: 0.55 };
}
