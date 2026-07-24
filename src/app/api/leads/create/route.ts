import { appFail, appOk, parseBody } from "@/lib/api";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";
import {
  ensureTrustProfile,
  recalculateAndPersistTrustScore,
  refreshCancellationAndDispute,
} from "@/lib/trust/profile";
import { ensureUserReputation } from "@/lib/reputation/service";
import { getReputationTier } from "@/lib/reputation/tiers";
import {
  ensureUserBehaviour,
  logBehaviourEvent,
} from "@/lib/behaviour/service";
import { calculateLeadQualityScore } from "@/lib/predictive/leadScore";

type CreateLeadBody = {
  userId?: string;
  vendorId?: string;
  intentId?: number | string;
  bookingId?: number | string;
  message?: string;
  valueEstimate?: number;
  probability?: number;
  smartBooking?: {
    summary?: {
      job_description?: string;
      instant_quote_range?: { min?: number; max?: number };
      photos?: string[];
      user_notes?: string;
    };
    scope?: {
      job_size?: string;
      job_complexity?: string;
      estimated_duration?: number;
      estimated_team_size?: number;
    };
    quote?: {
      price_range_min?: number;
      price_range_max?: number;
    };
    photos?: string[];
    userNotes?: string;
    preferredDate?: string;
  };
};

export async function POST(request: Request) {
  const body = await parseBody<CreateLeadBody>(request);
  const userId = String(body?.userId ?? "").trim();
  const vendorId = String(body?.vendorId ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const smartBooking = body?.smartBooking;

  if (!userId || !vendorId || !message) {
    return appFail(400, "userId, vendorId and message are required");
  }

  try {
    const supabase = createServiceClient();
    await ensureTrustProfile(userId);
    await refreshCancellationAndDispute(userId);
    await recalculateAndPersistTrustScore(userId, "lead_create");

    const { data: trustProfile } = await supabase
      .from("user_trust_profile")
      .select("trust_score, phone_verified, email_verified, cancellation_rate")
      .eq("user_id", userId)
      .maybeSingle();

    const trustScore = Number(trustProfile?.trust_score ?? 50);
    const phoneVerified = Boolean(trustProfile?.phone_verified);
    const emailVerified = Boolean(trustProfile?.email_verified);

    const reputation = await ensureUserReputation(userId);
    const reputationScore = Number(reputation.reputation_score ?? 50);
    const reputationTier = getReputationTier(reputationScore);
    const behaviour = await ensureUserBehaviour(userId);

    const leadQualityScore = calculateLeadQualityScore({
      bookings_completed: Number(behaviour.bookings_completed ?? 0),
      leads_responded: Number(behaviour.leads_responded ?? 0),
      messages_sent: Number(behaviour.messages_sent ?? 0),
      bookings_cancelled: Number(behaviour.bookings_cancelled ?? 0),
      avg_response_time: Number(behaviour.avg_response_time ?? 0),
      trust_score: trustScore,
      reputation_score: reputationScore,
      cancellation_rate: Number(trustProfile?.cancellation_rate ?? 0),
      response_time: Number(behaviour.avg_response_time ?? 0),
    });

    if (leadQualityScore < 20 && !phoneVerified) {
      await supabase.from("notifications").insert({
        user_id: userId,
        vendor_id: null,
        type: "verify_phone_prompt",
        message:
          "Verify your phone to improve your lead quality and continue sending leads.",
      });
      return appFail(403, "Phone verification required before sending leads");
    }

    const intentId = Number(body?.intentId);
    const bookingId = Number(body?.bookingId);

    const smartPayload = smartBooking
      ? {
          summary: smartBooking.summary ?? null,
          scope: smartBooking.scope ?? null,
          quote: smartBooking.quote ?? null,
          photos: Array.isArray(smartBooking.photos)
            ? smartBooking.photos
            : (smartBooking.summary?.photos ?? []),
          userNotes: String(
            smartBooking.userNotes ?? smartBooking.summary?.user_notes ?? "",
          ).trim(),
          preferredDate:
            String(smartBooking.preferredDate ?? "").trim() || null,
        }
      : null;

    const enrichedMessage = smartPayload
      ? `${message}\nSMART_BOOKING::${JSON.stringify(smartPayload)}`
      : message;

    const { data, error } = await supabase
      .from("leads")
      .insert({
        user_id: userId,
        vendor_id: vendorId,
        intent_id: Number.isFinite(intentId) && intentId > 0 ? intentId : null,
        booking_id:
          Number.isFinite(bookingId) && bookingId > 0 ? bookingId : null,
        message: enrichedMessage,
        status: "sent",
      })
      .select("id")
      .single();

    if (error) {
      return appFail(500, error.message);
    }

    await upsertCrmPipeline({
      vendorId,
      leadId: Number(data.id),
      stage: smartPayload ? "quote_sent" : "new_lead",
      valueEstimate: smartPayload?.quote?.price_range_max
        ? Number(smartPayload.quote.price_range_max)
        : Number(body?.valueEstimate ?? 0),
      probability: smartPayload ? 55 : Number(body?.probability ?? 15),
      metadata: {
        source: "api:leads:create",
        smartBooking: smartPayload,
      },
    });

    await logBehaviourEvent({
      userId,
      type: "lead_requested",
      metadata: { leadId: Number(data.id) },
    });

    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: vendorId,
      type:
        leadQualityScore >= 70
          ? "high_quality_lead"
          : reputationTier === "High Risk"
            ? "user_low_trust"
            : reputationTier === "Trusted"
              ? "user_trusted"
              : reputationTier === "Premium"
                ? "user_premium"
                : "user_verified",
      message:
        leadQualityScore >= 70
          ? `High Quality Lead (${userId}) with score ${leadQualityScore}.`
          : reputationTier === "High Risk"
            ? `User is High Risk (${userId}).`
            : reputationTier === "Trusted"
              ? `User is Trusted (${userId}).`
              : reputationTier === "Premium"
                ? `User is Premium (${userId}). Faster response expected.`
                : phoneVerified || emailVerified || trustScore >= 50
                  ? `Lead user (${userId}) has verification badges.`
                  : `New lead received from user ${userId}.`,
    });

    return appOk({ leadId: data.id, status: "sent" });
  } catch (error) {
    return appFail(
      500,
      error instanceof Error ? error.message : "Failed to create lead",
    );
  }
}
