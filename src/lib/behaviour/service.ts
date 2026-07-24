import { createServiceClient } from "@/lib/db";
import { calculateLeadQualityScore } from "@/lib/predictive/leadScore";

export const BEHAVIOUR_EVENT_TYPES = [
  "search",
  "lead_requested",
  "lead_responded",
  "booking_started",
  "booking_completed",
  "booking_cancelled",
  "message_sent",
  "message_received",
] as const;

export type BehaviourEventType = (typeof BEHAVIOUR_EVENT_TYPES)[number];

export type BehaviourRow = {
  id: number;
  user_id: string;
  searches: number;
  leads_requested: number;
  leads_responded: number;
  bookings_started: number;
  bookings_completed: number;
  bookings_cancelled: number;
  messages_sent: number;
  messages_received: number;
  avg_response_time: number;
  created_at: string;
  updated_at: string;
};

export async function ensureUserBehaviour(userIdInput: string) {
  const userId = String(userIdInput ?? "").trim();
  if (!userId) throw new Error("userId is required");

  const supabase = createServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("user_behaviour")
    .select(
      "id, user_id, searches, leads_requested, leads_responded, bookings_started, bookings_completed, bookings_cancelled, messages_sent, messages_received, avg_response_time, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing as BehaviourRow;

  const { data: inserted, error: insertError } = await supabase
    .from("user_behaviour")
    .insert({ user_id: userId })
    .select(
      "id, user_id, searches, leads_requested, leads_responded, bookings_started, bookings_completed, bookings_cancelled, messages_sent, messages_received, avg_response_time, created_at, updated_at",
    )
    .single();

  if (insertError) throw new Error(insertError.message);
  return inserted as BehaviourRow;
}

function updateRunningAverage(
  currentAvg: number,
  currentCount: number,
  nextSeconds: number,
) {
  const safeSeconds = Math.max(0, Math.round(Number(nextSeconds) || 0));
  const count = Math.max(0, currentCount);
  const total = currentAvg * count + safeSeconds;
  return Math.round(total / (count + 1));
}

export async function logBehaviourEvent(input: {
  userId: string;
  type: BehaviourEventType;
  metadata?: Record<string, unknown>;
}) {
  const userId = String(input.userId ?? "").trim();
  const type = input.type;
  const metadata = input.metadata ?? {};

  if (!userId) throw new Error("userId is required");
  if (!BEHAVIOUR_EVENT_TYPES.includes(type))
    throw new Error("Invalid behaviour event type");

  const supabase = createServiceClient();
  const row = await ensureUserBehaviour(userId);

  const patch = {
    searches: Number(row.searches ?? 0),
    leads_requested: Number(row.leads_requested ?? 0),
    leads_responded: Number(row.leads_responded ?? 0),
    bookings_started: Number(row.bookings_started ?? 0),
    bookings_completed: Number(row.bookings_completed ?? 0),
    bookings_cancelled: Number(row.bookings_cancelled ?? 0),
    messages_sent: Number(row.messages_sent ?? 0),
    messages_received: Number(row.messages_received ?? 0),
    avg_response_time: Number(row.avg_response_time ?? 0),
  };

  if (type === "search") patch.searches += 1;
  if (type === "lead_requested") patch.leads_requested += 1;
  if (type === "lead_responded") {
    patch.leads_responded += 1;
    const seconds = Number(metadata.responseTimeSeconds ?? 0);
    patch.avg_response_time = updateRunningAverage(
      patch.avg_response_time,
      patch.leads_responded - 1,
      seconds,
    );
  }
  if (type === "booking_started") patch.bookings_started += 1;
  if (type === "booking_completed") patch.bookings_completed += 1;
  if (type === "booking_cancelled") patch.bookings_cancelled += 1;
  if (type === "message_sent") patch.messages_sent += 1;
  if (type === "message_received") {
    patch.messages_received += 1;
    const seconds = Number(metadata.responseTimeSeconds ?? 0);
    if (Number.isFinite(seconds) && seconds > 0) {
      patch.avg_response_time = updateRunningAverage(
        patch.avg_response_time,
        patch.messages_received - 1,
        seconds,
      );
    }
  }

  const { error: updateError } = await supabase
    .from("user_behaviour")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  const [{ data: trust }, { data: reputation }, { data: trustProfile }] =
    await Promise.all([
      supabase
        .from("user_trust_profile")
        .select("trust_score")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_reputation")
        .select("reputation_score")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_trust_profile")
        .select("cancellation_rate")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const leadQualityScore = calculateLeadQualityScore({
    bookings_completed: patch.bookings_completed,
    leads_responded: patch.leads_responded,
    messages_sent: patch.messages_sent,
    bookings_cancelled: patch.bookings_cancelled,
    avg_response_time: patch.avg_response_time,
    trust_score: Number(trust?.trust_score ?? 50),
    reputation_score: Number(reputation?.reputation_score ?? 50),
    cancellation_rate: Number(trustProfile?.cancellation_rate ?? 0),
    response_time: patch.avg_response_time,
  });

  return {
    ok: true as const,
    leadQualityScore,
    behaviour: patch,
    trust_score: Number(trust?.trust_score ?? 50),
    reputation_score: Number(reputation?.reputation_score ?? 50),
  };
}
