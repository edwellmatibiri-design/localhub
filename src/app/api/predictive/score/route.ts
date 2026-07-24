import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { ensureUserBehaviour } from "@/lib/behaviour/service";
import { calculateLeadQualityScore } from "@/lib/predictive/leadScore";

type Body = { userId?: string };

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
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "userId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const behaviour = await ensureUserBehaviour(userId);

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

    const trustScore = Number(trust?.trust_score ?? 50);
    const reputationScore = Number(reputation?.reputation_score ?? 50);

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

    return NextResponse.json({
      ok: true,
      leadQualityScore,
      trust_score: trustScore,
      reputation_score: reputationScore,
      behaviourSummary: {
        searches: Number(behaviour.searches ?? 0),
        leads_requested: Number(behaviour.leads_requested ?? 0),
        leads_responded: Number(behaviour.leads_responded ?? 0),
        bookings_started: Number(behaviour.bookings_started ?? 0),
        bookings_completed: Number(behaviour.bookings_completed ?? 0),
        bookings_cancelled: Number(behaviour.bookings_cancelled ?? 0),
        messages_sent: Number(behaviour.messages_sent ?? 0),
        messages_received: Number(behaviour.messages_received ?? 0),
        avg_response_time: Number(behaviour.avg_response_time ?? 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to score lead quality",
      },
      { status: 500 },
    );
  }
}
