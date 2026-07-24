import type { JobComplexity, JobSize } from "@/lib/booking/autoScope";

type PricingConfig = {
  base?: number;
  size?: { small?: number; medium?: number; large?: number };
  complexity?: { low?: number; medium?: number; high?: number };
  duration_unit?: number;
};

export type InstantQuoteResult = {
  price_range_min: number;
  price_range_max: number;
};

export function buildInstantQuote(input: {
  job_size: JobSize;
  job_complexity: JobComplexity;
  estimated_duration: number;
  config?: PricingConfig;
}): InstantQuoteResult {
  const config = input.config ?? {};
  const base = Number(config.base ?? 300);
  const sizeMultiplierMap = {
    small: Number(config.size?.small ?? 1),
    medium: Number(config.size?.medium ?? 1.5),
    large: Number(config.size?.large ?? 2.5),
  } as const;

  const complexityMultiplierMap = {
    low: Number(config.complexity?.low ?? 1),
    medium: Number(config.complexity?.medium ?? 1.3),
    high: Number(config.complexity?.high ?? 1.6),
  } as const;

  const durationUnit = Number(config.duration_unit ?? 150);
  const durationMultiplier =
    Math.max(0, Number(input.estimated_duration ?? 0)) * durationUnit;

  const total =
    base *
      sizeMultiplierMap[input.job_size] *
      complexityMultiplierMap[input.job_complexity] +
    durationMultiplier;

  return {
    price_range_min: Math.max(0, Math.round(total * 0.9)),
    price_range_max: Math.max(0, Math.round(total * 1.2)),
  };
}
