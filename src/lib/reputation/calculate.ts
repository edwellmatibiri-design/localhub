export type ReputationSnapshot = {
  completed_bookings: number;
  cancelled_bookings: number;
  on_time_payments: number;
  late_payments: number;
  dispute_count: number;
  abusive_flags: number;
  positive_events: number;
  negative_events: number;
};

export function calculateReputationScore(input: ReputationSnapshot) {
  let score = 50;

  score += 5 * Number(input.completed_bookings ?? 0);
  score += 3 * Number(input.on_time_payments ?? 0);
  score += 2 * Number(input.positive_events ?? 0);

  score -= 10 * Number(input.cancelled_bookings ?? 0);
  score -= 15 * Number(input.late_payments ?? 0);
  score -= 20 * Number(input.dispute_count ?? 0);
  score -= 25 * Number(input.abusive_flags ?? 0);

  // Negative feedback and dispute_resolved(user at fault) are both recorded in negative_events.
  score -= 3 * Number(input.negative_events ?? 0);

  return Math.max(0, Math.min(100, Math.round(score)));
}
