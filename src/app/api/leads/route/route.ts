import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { computeRankingScore } from "@/lib/search/rankingFormula";
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

type RoutingStrategy =
  | "round_robin"
  | "top_ranked"
  | "balanced"
  | "fastest_response";

type Body = {
  userId?: string;
  intentId?: number | string;
  category?: string;
  location?: string;
  message?: string;
  smartBooking?: {
    summary?: {
      job_description?: string;
      job_size?: string;
      complexity?: string;
      estimated_duration?: number;
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

type Candidate = {
  vendorId: string;
  rankingScore: number;
  responseTimeAvg: number;
};

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function pickVendors(
  candidates: Candidate[],
  maxVendors: number,
  strategy: RoutingStrategy,
): Candidate[] {
  const safeMax = Math.max(1, maxVendors);
  if (candidates.length <= safeMax) {
    return candidates;
  }

  if (strategy === "top_ranked") {
    return candidates.slice(0, safeMax);
  }

  if (strategy === "fastest_response") {
    return [...candidates]
      .sort(
        (a, b) =>
          a.responseTimeAvg - b.responseTimeAvg ||
          b.rankingScore - a.rankingScore,
      )
      .slice(0, safeMax);
  }

  if (strategy === "round_robin") {
    const offset =
      Math.floor(Date.now() / (1000 * 60 * 60)) % candidates.length;
    const cycled = [
      ...candidates.slice(offset),
      ...candidates.slice(0, offset),
    ];
    return cycled.slice(0, safeMax);
  }

  const topSorted = [...candidates].sort(
    (a, b) => b.rankingScore - a.rankingScore,
  );
  const selected: Candidate[] = [];
  const midStart = Math.floor(topSorted.length / 3);
  const midEnd = Math.max(midStart + 1, Math.floor((topSorted.length * 2) / 3));
  const midBucket = topSorted.slice(midStart, midEnd);

  if (topSorted.length > 0) selected.push(topSorted[0]);
  if (midBucket.length > 0 && selected.length < safeMax)
    selected.push(midBucket[0]);

  for (const candidate of topSorted) {
    if (selected.find((item) => item.vendorId === candidate.vendorId)) continue;
    selected.push(candidate);
    if (selected.length >= safeMax) break;
  }

  return selected.slice(0, safeMax);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const userId = String(body.userId ?? "").trim();
  const categoryInput = String(body.category ?? "").trim();
  const locationInput = String(body.location ?? "").trim();
  const message = String(body.message ?? "").trim();
  const smartBooking = body.smartBooking;
  const intentIdNumber = Number(body.intentId);

  if (!userId || !categoryInput || !locationInput || !message) {
    return NextResponse.json(
      { ok: false, error: "userId, category, location, message are required" },
      { status: 400 },
    );
  }

  const intentId =
    Number.isFinite(intentIdNumber) && intentIdNumber > 0
      ? intentIdNumber
      : null;

  try {
    const supabase = createServiceClient();

    await ensureTrustProfile(userId);
    await refreshCancellationAndDispute(userId);
    await recalculateAndPersistTrustScore(userId, "lead_routing");

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
      return NextResponse.json(
        {
          ok: false,
          error: "Phone verification required before sending leads",
        },
        { status: 403 },
      );
    }

    const normalizedCategory = normalize(categoryInput);
    const normalizedLocation = normalize(locationInput);

    const { data: rule } = await supabase
      .from("lead_routing_rules")
      .select("id, max_vendors, routing_strategy")
      .eq("category", normalizedCategory)
      .eq("location", normalizedLocation)
      .maybeSingle();

    const maxVendorsRule = Number(rule?.max_vendors ?? 3) || 3;
    let maxVendors = maxVendorsRule;
    let strategy = String(
      rule?.routing_strategy ?? "top_ranked",
    ) as RoutingStrategy;

    if (leadQualityScore < 20) {
      maxVendors = 1;
    } else if (leadQualityScore >= 20 && leadQualityScore <= 40) {
      maxVendors = 2;
    } else if (leadQualityScore >= 70) {
      maxVendors = Math.max(4, maxVendorsRule);
      strategy = "fastest_response";
    } else if (reputationTier === "Trusted" || reputationTier === "Premium") {
      strategy = "top_ranked";
    }

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug")
      .limit(500);
    const { data: suburbs } = await supabase
      .from("suburbs")
      .select("id, name, slug, city")
      .limit(2000);

    const categoryRow = (categories ?? []).find((row) => {
      const name = normalize(row.name);
      const slug = normalize(row.slug);
      return name === normalizedCategory || slug === normalizedCategory;
    });

    const locationRow = (suburbs ?? []).find((row) => {
      const name = normalize(row.name);
      const slug = normalize(row.slug);
      return name === normalizedLocation || slug === normalizedLocation;
    });

    if (!categoryRow || !locationRow) {
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: "admin",
        type: "lead_routing_failure",
        message: `Lead routing failed: category=${normalizedCategory}, location=${normalizedLocation}, reason=missing category/location mapping`,
      });
      return NextResponse.json(
        { ok: false, error: "No matching category/location mapping" },
        { status: 404 },
      );
    }

    const { data: vendors } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("category_id", categoryRow.id)
      .eq("suburb_id", locationRow.id);

    const vendorIds = (vendors ?? [])
      .map((row) => String(row.id))
      .filter(Boolean);
    if (!vendorIds.length) {
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: "admin",
        type: "lead_routing_failure",
        message: `Lead routing failed: category=${normalizedCategory}, location=${normalizedLocation}, reason=no vendors`,
      });
      return NextResponse.json(
        { ok: false, error: "No vendors found for category/location" },
        { status: 404 },
      );
    }

    const [{ data: trustRows }, { data: reviewRows }, { data: metricsRows }] =
      await Promise.all([
        supabase
          .from("vendor_trust_scores")
          .select("vendor_id, trust_score")
          .in("vendor_id", vendorIds),
        supabase
          .from("reviews")
          .select("vendor_id, rating")
          .in("vendor_id", vendorIds),
        supabase
          .from("vendor_metrics")
          .select("vendor_id, response_time_avg")
          .in("vendor_id", vendorIds),
      ]);

    const trustByVendor = new Map<string, number>(
      (trustRows ?? []).map((row) => [
        String(row.vendor_id),
        Number(row.trust_score) || 0,
      ]),
    );
    const reviewVolumeByVendor = new Map<string, number>();
    (reviewRows ?? []).forEach((row) => {
      const vendorId = String(row.vendor_id ?? "");
      reviewVolumeByVendor.set(
        vendorId,
        (reviewVolumeByVendor.get(vendorId) ?? 0) + 1,
      );
    });
    const responseByVendor = new Map<string, number>(
      (metricsRows ?? []).map((row) => [
        String(row.vendor_id),
        Number(row.response_time_avg) || 0,
      ]),
    );

    const rankedCandidates = vendorIds
      .map((vendorId) => {
        const responseTimeAvg = responseByVendor.get(vendorId) ?? 0;
        const rankingScore = computeRankingScore({
          trustScore: trustByVendor.get(vendorId) ?? 0,
          freshnessScore: 60,
          reviewVolume: reviewVolumeByVendor.get(vendorId) ?? 0,
          internalLinkCount: 5,
          recencyPenalty: 0,
          responseTimeAvg,
        });

        return { vendorId, rankingScore, responseTimeAvg };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore);

    const selected = pickVendors(rankedCandidates, maxVendors, strategy);

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

    const { data: insertedLeads, error: leadInsertError } = await supabase
      .from("leads")
      .insert(
        selected.map((candidate) => ({
          user_id: userId,
          vendor_id: candidate.vendorId,
          booking_id: null,
          intent_id: intentId,
          message: enrichedMessage,
          status: "sent",
        })),
      )
      .select("id, vendor_id");

    if (leadInsertError) {
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: "admin",
        type: "lead_routing_failure",
        message: `Lead routing failed while inserting leads: ${leadInsertError.message}`,
      });
      return NextResponse.json(
        { ok: false, error: leadInsertError.message },
        { status: 500 },
      );
    }

    await Promise.all(
      (insertedLeads ?? []).map((lead) =>
        upsertCrmPipeline({
          vendorId: String(lead.vendor_id),
          leadId: Number(lead.id),
          stage: smartPayload ? "quote_sent" : "new_lead",
          probability: smartPayload ? 55 : 15,
          valueEstimate: smartPayload?.quote?.price_range_max
            ? Number(smartPayload.quote.price_range_max)
            : undefined,
          metadata: {
            source: "api:leads:route",
            smartBooking: smartPayload,
          },
        }),
      ),
    );

    await logBehaviourEvent({
      userId,
      type: "lead_requested",
      metadata: { count: (insertedLeads ?? []).length, leadQualityScore },
    });

    await supabase.from("notifications").insert(
      selected.map((candidate) => ({
        user_id: null,
        vendor_id: candidate.vendorId,
        type: "new_lead",
        message: smartPayload?.quote
          ? `New Smart Booking Lead for ${categoryInput} in ${locationInput}. Instant quote: R ${Number(smartPayload.quote.price_range_min ?? 0)} - R ${Number(smartPayload.quote.price_range_max ?? 0)}.`
          : `New Lead received for ${categoryInput} in ${locationInput}.`,
      })),
    );

    if (leadQualityScore >= 70) {
      await supabase.from("notifications").insert(
        selected.map((candidate) => ({
          user_id: null,
          vendor_id: candidate.vendorId,
          type: "high_quality_lead",
          message: `High Quality Lead (${userId}) with score ${leadQualityScore}.`,
        })),
      );
    } else if (reputationTier === "High Risk") {
      await supabase.from("notifications").insert(
        selected.map((candidate) => ({
          user_id: null,
          vendor_id: candidate.vendorId,
          type: "user_low_trust",
          message: `User is High Risk (${userId}).`,
        })),
      );
    } else if (reputationTier === "Trusted") {
      await supabase.from("notifications").insert(
        selected.map((candidate) => ({
          user_id: null,
          vendor_id: candidate.vendorId,
          type: "user_trusted",
          message: `User is Trusted (${userId}).`,
        })),
      );
    } else if (reputationTier === "Premium") {
      await supabase.from("notifications").insert(
        selected.map((candidate) => ({
          user_id: null,
          vendor_id: candidate.vendorId,
          type: "user_premium",
          message: `User is Premium (${userId}). Faster response expected.`,
        })),
      );
    } else if (phoneVerified || emailVerified || trustScore >= 50) {
      await supabase.from("notifications").insert(
        selected.map((candidate) => ({
          user_id: null,
          vendor_id: candidate.vendorId,
          type: "user_verified",
          message: `Lead user (${userId}) has verification badges.`,
        })),
      );
    }

    return NextResponse.json({
      ok: true,
      vendorsSent: selected.map((item) => item.vendorId),
      leadIds: (insertedLeads ?? []).map((item) => Number(item.id)),
      leadQualityScore,
    });
  } catch (error) {
    const supabase = createServiceClient();
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: "admin",
      type: "lead_routing_failure",
      message: `Lead routing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to route leads",
      },
      { status: 500 },
    );
  }
}
