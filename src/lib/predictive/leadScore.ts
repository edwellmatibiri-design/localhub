export type LeadScoreInput = {
  bookings_completed: number;
  leads_responded: number;
  messages_sent: number;
  bookings_cancelled: number;
  avg_response_time: number;
  trust_score: number;
  reputation_score: number;
  cancellation_rate: number;
  response_time: number;
};

export function calculateLeadQualityScore(input: LeadScoreInput) {
  const score =
    Number(input.bookings_completed ?? 0) * 5 +
    Number(input.leads_responded ?? 0) * 3 +
    Number(input.messages_sent ?? 0) * 1 -
    Number(input.bookings_cancelled ?? 0) * 4 -
    Number(input.avg_response_time ?? input.response_time ?? 0) / 30 +
    Number(input.trust_score ?? 50) * 0.2 +
    Number(input.reputation_score ?? 50) * 0.3;

  return Math.max(0, Math.min(100, Math.round(score)));
}
