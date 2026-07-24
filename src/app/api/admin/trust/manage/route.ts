import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import {
  ensureTrustProfile,
  recalculateAndPersistTrustScore,
} from "@/lib/trust/profile";
import { flagUser, USER_FLAG_TYPES } from "@/lib/trust/flagUser";

type Body = {
  action?:
    | "adjust_trust_score"
    | "flag_user"
    | "lock_user_bookings"
    | "unlock_user_bookings";
  userId?: string;
  trustScore?: number | string;
  flagType?: string;
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

    if (action === "adjust_trust_score") {
      const trustScore = Number(body.trustScore);
      if (!Number.isFinite(trustScore)) {
        return NextResponse.json(
          { ok: false, error: "trustScore must be a number" },
          { status: 400 },
        );
      }

      await ensureTrustProfile(userId);
      const { error } = await supabase
        .from("user_trust_profile")
        .update({
          trust_score: Math.max(0, Math.min(100, Math.round(trustScore))),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);

      await supabase.from("notifications").insert({
        user_id: userId,
        vendor_id: null,
        type: "trust_score_changed",
        message: `Your trust score has been adjusted by admin to ${Math.max(0, Math.min(100, Math.round(trustScore)))}.`,
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "flag_user") {
      const flagType = String(
        body.flagType ?? "",
      ) as (typeof USER_FLAG_TYPES)[number];
      if (!USER_FLAG_TYPES.includes(flagType)) {
        return NextResponse.json(
          { ok: false, error: "Invalid flagType" },
          { status: 400 },
        );
      }
      await flagUser({ userId, flagType });
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

      await recalculateAndPersistTrustScore(userId, action);
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
          error instanceof Error ? error.message : "Failed to manage trust",
      },
      { status: 500 },
    );
  }
}
