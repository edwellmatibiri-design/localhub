type JobSize = "small" | "medium" | "large";
type JobComplexity = "low" | "medium" | "high";

export type VendorInstantQuoteInput = {
  jobSize: JobSize;
  jobComplexity: JobComplexity;
  estimatedDuration: number;
  category: string;
};

export type VendorInstantQuoteOutput = {
  minPrice: number;
  maxPrice: number;
  confidence: number;
};

export function generateVendorInstantQuote(
  input: VendorInstantQuoteInput,
): VendorInstantQuoteOutput {
  const base = 300;
  const sizeMultiplier: Record<JobSize, number> = {
    small: 1,
    medium: 1.5,
    large: 2.5,
  };

  const complexityMultiplier: Record<JobComplexity, number> = {
    low: 1,
    medium: 1.3,
    high: 1.6,
  };

  const duration = Math.max(0, Number(input.estimatedDuration ?? 0));
  const durationMultiplier = duration * 150;

  const total =
    base *
      sizeMultiplier[input.jobSize] *
      complexityMultiplier[input.jobComplexity] +
    durationMultiplier;

  const categoryBoost = /tree|plumb/i.test(String(input.category ?? ""))
    ? 0.05
    : 0;
  const confidence = Math.max(
    0.55,
    Math.min(0.95, 0.7 + categoryBoost - Math.min(0.2, duration * 0.01)),
  );

  return {
    minPrice: Math.round(total * 0.9),
    maxPrice: Math.round(total * 1.2),
    confidence: Number(confidence.toFixed(2)),
  };
}
