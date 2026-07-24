import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import {
  ensureTrustProfile,
  recalculateAndPersistTrustScore,
} from "@/lib/trust/profile";

type Body = {
  userId?: string;
  email?: string;
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

  const userId = String(body.userId ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (!userId || !email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "userId and valid email are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const profile = await ensureTrustProfile(userId);

    // Placeholder verification-link flow.
    const clickedVerificationLink = true;
    if (!clickedVerificationLink) {
      return NextResponse.json(
        { ok: false, error: "Email verification incomplete" },
        { status: 400 },
      );
    }

    const base = Number(profile.trust_score ?? 50);
    const next = Math.min(100, base + 10);

    const { error } = await supabase
      .from("user_trust_profile")
      .update({
        email_verified: true,
        trust_score: next,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    await recalculateAndPersistTrustScore(userId, "email_verified");

    await supabase.from("notifications").insert([
      {
        user_id: userId,
        vendor_id: null,
        type: "user_verified",
        message: "Email verification complete. Trust score increased.",
      },
      {
        user_id: null,
        vendor_id: "admin",
        type: "user_verified",
        message: `User ${userId} verified email.`,
      },
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to verify email",
      },
      { status: 500 },
    );
  }
}
