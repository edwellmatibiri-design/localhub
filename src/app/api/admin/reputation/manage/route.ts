import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import {
  ensureUserReputation,
  logReputationEvent,
} from "@/lib/reputation/service";
import { ensureTrustProfile } from "@/lib/trust/profile";
import { flagUser } from "@/lib/trust/flagUser";

type Body = {
  action?:
    | "adjust_reputation_score"
    | "lock_user_bookings"
    | "unlock_user_bookings"
    | "flag_user"
    | "reset_reputation";
  userId?: string;
  reputationScore?: number | string;
};

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

  const action = String(body.action ?? "").trim();
  const userId = String(body.userId ?? "").trim();

  if (!action || !userId) {
    return NextResponse.json(
      { ok: false, error: "action and userId are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    if (action === "adjust_reputation_score") {
      const score = Number(body.reputationScore);
      if (!Number.isFinite(score)) {
        return NextResponse.json(
          { ok: false, error: "reputationScore must be a number" },
          { status: 400 },
        );
      }

      await ensureUserReputation(userId);
      const { error } = await supabase
        .from("user_reputation")
        .update({
          reputation_score: Math.max(0, Math.min(100, Math.round(score))),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);

      return NextResponse.json({ ok: true });
    }

    if (action === "lock_user_bookings" || action === "unlock_user_bookings") {
      await ensureTrustProfile(userId);
      const { error } = await supabase
        .from("user_trust_profile")
        .update({
          bookings_locked: action === "lock_user_bookings",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "flag_user") {
      await logReputationEvent({ userId, type: "abusive_flag" });
      await flagUser({ userId, flagType: "abusive_message" });
      return NextResponse.json({ ok: true });
    }

    if (action === "reset_reputation") {
      await ensureUserReputation(userId);
      const { error } = await supabase
        .from("user_reputation")
        .update({
          reputation_score: 50,
          positive_events: 0,
          negative_events: 0,
          completed_bookings: 0,
          cancelled_bookings: 0,
          on_time_payments: 0,
          late_payments: 0,
          dispute_count: 0,
          abusive_flags: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to manage reputation",
      },
      { status: 500 },
    );
  }
}
