export type VariantStats = {
  visitors: number;
  conversions: number;
};

export type SignificanceResult = {
  winner: "A" | "B" | "none";
  confidence: number;
};

function conversionRate(stats: VariantStats): number {
  if (stats.visitors <= 0) return 0;
  return stats.conversions / stats.visitors;
}

export function testSignificance(a: VariantStats, b: VariantStats): SignificanceResult {
  const rateA = conversionRate(a);
  const rateB = conversionRate(b);
  const diff = Math.abs(rateA - rateB);
  const sample = a.visitors + b.visitors;
  const confidence = Math.min(0.999, diff * Math.sqrt(sample));

  if (confidence < 0.95) {
    return { winner: "none", confidence };
  }

  return { winner: rateA > rateB ? "A" : "B", confidence };
}
