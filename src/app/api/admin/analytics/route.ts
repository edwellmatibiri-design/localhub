import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { calculateLeadQualityScore } from "@/lib/predictive/leadScore";

type QueryInput = {
  startDate: string;
  endDate: string;
  category: string;
  vendor: string;
  user: string;
};

function parseFilters(url: URL): QueryInput {
  return {
    startDate: String(url.searchParams.get("startDate") ?? "").trim(),
    endDate: String(url.searchParams.get("endDate") ?? "").trim(),
    category: String(url.searchParams.get("category") ?? "")
      .trim()
      .toLowerCase(),
    vendor: String(url.searchParams.get("vendor") ?? "").trim(),
    user: String(url.searchParams.get("user") ?? "").trim(),
  };
}

function inRange(dateIso: string, filters: QueryInput) {
  if (!dateIso) return true;
  const d = String(dateIso).slice(0, 10);
  if (filters.startDate && d < filters.startDate) return false;
  if (filters.endDate && d > filters.endDate) return false;
  return true;
}

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const filters = parseFilters(new URL(request.url));

    const [
      { data: bookings },
      { data: disputes },
      { data: leads },
      { data: metrics },
      { data: trustRows },
      { data: reputationRows },
      { data: behaviourRows },
      { data: scopes },
      { data: sessions },
      { data: quoteRows },
      { data: outreachStats },
      { data: outreachBusinesses },
      { data: outreachMessages },
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, user_id, vendor_id, status, preferred_date")
        .limit(10000),
      supabase
        .from("disputes")
        .select("id, user_id, vendor_id, created_at")
        .limit(10000),
      supabase
        .from("leads")
        .select("id, user_id, vendor_id, status, created_at, message")
        .limit(10000),
      supabase
        .from("vendor_metrics")
        .select("vendor_id, response_time_avg")
        .limit(5000),
      supabase
        .from("user_trust_profile")
        .select("user_id, trust_score")
        .limit(10000),
      supabase
        .from("user_reputation")
        .select("user_id, reputation_score")
        .limit(10000),
      supabase
        .from("user_behaviour")
        .select(
          "user_id, bookings_completed, leads_responded, messages_sent, bookings_cancelled, avg_response_time",
        )
        .limit(10000),
      supabase
        .from("booking_scopes")
        .select(
          "id, category, created_at, user_id, instant_quote_min, instant_quote_max",
        )
        .limit(10000),
      supabase
        .from("ai_sessions")
        .select("id, role, user_id, vendor_id, created_at")
        .limit(10000),
      supabase
        .from("vendor_crm_quotes")
        .select(
          "id, booking_id, vendor_id, category, min_price, max_price, confidence, created_at",
        )
        .limit(10000),
      supabase
        .from("outreach_stats")
        .select(
          "id, total_sent, total_replied, total_failed, email_open_rate, whatsapp_reply_rate, sms_reply_rate, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("outreach_businesses")
        .select("id, category, location, status, created_at")
        .limit(10000),
      supabase
        .from("outreach_messages")
        .select("id, business_id, direction, created_at")
        .limit(10000),
    ]);

    const filteredBookings = (bookings ?? []).filter((row) => {
      if (!inRange(String(row.preferred_date ?? row.id), filters)) return false;
      if (filters.vendor && String(row.vendor_id ?? "") !== filters.vendor)
        return false;
      if (filters.user && String(row.user_id ?? "") !== filters.user)
        return false;
      return true;
    });

    const filteredDisputes = (disputes ?? []).filter((row) => {
      if (!inRange(String(row.created_at ?? ""), filters)) return false;
      if (filters.vendor && String(row.vendor_id ?? "") !== filters.vendor)
        return false;
      if (filters.user && String(row.user_id ?? "") !== filters.user)
        return false;
      return true;
    });

    const filteredScopes = (scopes ?? []).filter((row) => {
      if (!inRange(String(row.created_at ?? ""), filters)) return false;
      if (filters.category && String(row.category ?? "") !== filters.category)
        return false;
      if (filters.user && String(row.user_id ?? "") !== filters.user)
        return false;
      return true;
    });

    const vendorResponseRate = (() => {
      const byVendor = new Map<string, { sent: number; responded: number }>();
      (leads ?? []).forEach((lead) => {
        if (!inRange(String(lead.created_at ?? ""), filters)) return;
        const vendorId = String(lead.vendor_id ?? "");
        if (filters.vendor && vendorId !== filters.vendor) return;
        if (filters.user && String(lead.user_id ?? "") !== filters.user) return;

        const bucket = byVendor.get(vendorId) ?? { sent: 0, responded: 0 };
        bucket.sent += 1;
        if (String(lead.status ?? "") === "accepted") bucket.responded += 1;
        byVendor.set(vendorId, bucket);
      });

      const rates = Array.from(byVendor.values()).map((row) =>
        row.sent > 0 ? row.responded / row.sent : 0,
      );
      if (rates.length === 0) return 0;
      return rates.reduce((sum, value) => sum + value, 0) / rates.length;
    })();

    const trustDistribution = {
      low: 0,
      medium: 0,
      high: 0,
    };

    (trustRows ?? []).forEach((row) => {
      const score = Number(row.trust_score ?? 50);
      if (score < 40) trustDistribution.low += 1;
      else if (score < 70) trustDistribution.medium += 1;
      else trustDistribution.high += 1;
    });

    const reputationDistribution = {
      low: 0,
      medium: 0,
      high: 0,
    };

    (reputationRows ?? []).forEach((row) => {
      const score = Number(row.reputation_score ?? 50);
      if (score < 40) reputationDistribution.low += 1;
      else if (score < 70) reputationDistribution.medium += 1;
      else reputationDistribution.high += 1;
    });

    const trustByUser = new Map<string, number>(
      (trustRows ?? []).map((row) => [
        String(row.user_id),
        Number(row.trust_score ?? 50),
      ]),
    );
    const reputationByUser = new Map<string, number>(
      (reputationRows ?? []).map((row) => [
        String(row.user_id),
        Number(row.reputation_score ?? 50),
      ]),
    );

    const predictiveDistribution = {
      low: 0,
      medium: 0,
      high: 0,
    };

    (behaviourRows ?? []).forEach((row) => {
      const score = calculateLeadQualityScore({
        bookings_completed: Number(row.bookings_completed ?? 0),
        leads_responded: Number(row.leads_responded ?? 0),
        messages_sent: Number(row.messages_sent ?? 0),
        bookings_cancelled: Number(row.bookings_cancelled ?? 0),
        avg_response_time: Number(row.avg_response_time ?? 0),
        trust_score: trustByUser.get(String(row.user_id ?? "")) ?? 50,
        reputation_score: reputationByUser.get(String(row.user_id ?? "")) ?? 50,
        cancellation_rate: 0,
        response_time: Number(row.avg_response_time ?? 0),
      });

      if (score < 40) predictiveDistribution.low += 1;
      else if (score < 70) predictiveDistribution.medium += 1;
      else predictiveDistribution.high += 1;
    });

    const categoryPerformanceMap = new Map<
      string,
      { count: number; avgRange: number }
    >();
    filteredScopes.forEach((row) => {
      const category = String(row.category ?? "unknown");
      const min = Number(row.instant_quote_min ?? 0);
      const max = Number(row.instant_quote_max ?? 0);
      const range = Math.max(0, max - min);
      const bucket = categoryPerformanceMap.get(category) ?? {
        count: 0,
        avgRange: 0,
      };
      bucket.count += 1;
      bucket.avgRange += range;
      categoryPerformanceMap.set(category, bucket);
    });

    const categoryPerformance = Array.from(
      categoryPerformanceMap.entries(),
    ).map(([category, bucket]) => ({
      category,
      bookings: bucket.count,
      avgQuoteRange:
        bucket.count > 0 ? Math.round(bucket.avgRange / bucket.count) : 0,
    }));

    const instantQuoteAccuracy = (() => {
      const rows = (quoteRows ?? []).filter((row) =>
        inRange(String(row.created_at ?? ""), filters),
      );
      if (rows.length === 0) return 0;
      const weighted = rows.reduce(
        (sum, row) => sum + Number(row.confidence ?? 0),
        0,
      );
      return weighted / rows.length;
    })();

    const filteredSessions = (sessions ?? []).filter((row) => {
      if (!inRange(String(row.created_at ?? ""), filters)) return false;
      if (filters.vendor && String(row.vendor_id ?? "") !== filters.vendor)
        return false;
      if (filters.user && String(row.user_id ?? "") !== filters.user)
        return false;
      return true;
    });

    const outreach = (() => {
      const latest = (outreachStats ?? [])[0] ?? {
        total_sent: 0,
        total_replied: 0,
        total_failed: 0,
        email_open_rate: 0,
        whatsapp_reply_rate: 0,
        sms_reply_rate: 0,
      };

      const filteredBusinesses = (outreachBusinesses ?? []).filter((row) =>
        inRange(String(row.created_at ?? ""), filters),
      );
      const filteredOutreachMessages = (outreachMessages ?? []).filter((row) =>
        inRange(String(row.created_at ?? ""), filters),
      );

      const categoryMap = new Map<string, { total: number; replied: number }>();
      const locationMap = new Map<string, { total: number; replied: number }>();

      filteredBusinesses.forEach((row) => {
        const category = String(row.category ?? "unknown");
        const location = String(row.location ?? "unknown");
        const status = String(row.status ?? "new");

        const c = categoryMap.get(category) ?? { total: 0, replied: 0 };
        c.total += 1;
        if (["responded", "onboarding", "completed"].includes(status))
          c.replied += 1;
        categoryMap.set(category, c);

        const l = locationMap.get(location) ?? { total: 0, replied: 0 };
        l.total += 1;
        if (["responded", "onboarding", "completed"].includes(status))
          l.replied += 1;
        locationMap.set(location, l);
      });

      const volume = filteredOutreachMessages.filter(
        (row) => String(row.direction ?? "") === "outbound",
      ).length;
      const replies = filteredOutreachMessages.filter(
        (row) => String(row.direction ?? "") === "inbound",
      ).length;
      const onboardingCount = filteredBusinesses.filter(
        (row) => String(row.status ?? "") === "completed",
      ).length;

      return {
        totalSent: Number(latest.total_sent ?? 0),
        totalReplied: Number(latest.total_replied ?? 0),
        totalFailed: Number(latest.total_failed ?? 0),
        emailOpenRate: Number(latest.email_open_rate ?? 0),
        whatsappReplyRate: Number(latest.whatsapp_reply_rate ?? 0),
        smsReplyRate: Number(latest.sms_reply_rate ?? 0),
        outreachVolume: volume,
        outreachReplyRate: volume > 0 ? replies / volume : 0,
        onboardingRate:
          filteredBusinesses.length > 0
            ? onboardingCount / filteredBusinesses.length
            : 0,
        categoryPerformance: Array.from(categoryMap.entries()).map(
          ([key, value]) => ({
            category: key,
            total: value.total,
            replyRate: value.total > 0 ? value.replied / value.total : 0,
          }),
        ),
        locationPerformance: Array.from(locationMap.entries()).map(
          ([key, value]) => ({
            location: key,
            total: value.total,
            replyRate: value.total > 0 ? value.replied / value.total : 0,
          }),
        ),
      };
    })();

    return NextResponse.json({
      ok: true,
      metrics: {
        totalBookings: filteredBookings.length,
        completedBookings: filteredBookings.filter(
          (row) => String(row.status) === "completed",
        ).length,
        cancelledBookings: filteredBookings.filter(
          (row) => String(row.status) === "cancelled",
        ).length,
        disputeCount: filteredDisputes.length,
        vendorResponseRate,
        userTrustDistribution: trustDistribution,
        reputationDistribution,
        predictiveScoreDistribution: predictiveDistribution,
        categoryPerformance,
        instantQuoteAccuracy,
        aiUsageMetrics: {
          totalSessions: filteredSessions.length,
          userSessions: filteredSessions.filter(
            (row) => String(row.role ?? "") === "user",
          ).length,
          vendorSessions: filteredSessions.filter(
            (row) => String(row.role ?? "") === "vendor",
          ).length,
        },
        outreach,
      },
      filters,
      vendorMetrics: metrics ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to load analytics",
      },
      { status: 500 },
    );
  }
}
