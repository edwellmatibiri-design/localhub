import type { AutoScopeResult } from "@/lib/booking/autoScope";
import type { InstantQuoteResult } from "@/lib/booking/instantQuote";

export type BookingSummaryInput = {
  category: string;
  answers: Record<string, unknown>;
  scope: AutoScopeResult;
  quote: InstantQuoteResult;
  photos?: string[];
  userNotes?: string;
};

export type BookingSummaryResult = {
  job_description: string;
  job_size: AutoScopeResult["job_size"];
  complexity: AutoScopeResult["job_complexity"];
  estimated_duration: number;
  instant_quote_range: { min: number; max: number };
  photos: string[];
  user_notes: string;
};

function stringifyAnswer(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "").trim();
}

export function generateBookingSummary(
  input: BookingSummaryInput,
): BookingSummaryResult {
  const category = String(input.category ?? "service").replace(/_/g, " ");
  const answers = input.answers ?? {};
  const lines = Object.entries(answers)
    .map(
      ([key, value]) => `${key.replace(/_/g, " ")}: ${stringifyAnswer(value)}`,
    )
    .filter((line) => !line.endsWith(": "));

  const userNotes = String(input.userNotes ?? "").trim();
  if (userNotes) {
    lines.push(`user notes: ${userNotes}`);
  }

  return {
    job_description: `Smart booking summary for ${category}: ${lines.join(" | ")}`,
    job_size: input.scope.job_size,
    complexity: input.scope.job_complexity,
    estimated_duration: input.scope.estimated_duration,
    instant_quote_range: {
      min: input.quote.price_range_min,
      max: input.quote.price_range_max,
    },
    photos: (input.photos ?? []).map((photo) => String(photo)).filter(Boolean),
    user_notes: userNotes,
  };
}
