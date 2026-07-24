import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  referrerId?: string;
  referredEmail?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
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

  const referrerId = String(body.referrerId ?? "").trim();
  const referredEmail = normalizeEmail(String(body.referredEmail ?? ""));

  if (!referrerId || !referredEmail || !referredEmail.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "referrerId and valid referredEmail are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { error: referralError } = await supabase.from("referrals").upsert(
      {
        referrer_id: referrerId,
        referred_id: referredEmail,
        status: "pending",
      },
      { onConflict: "referrer_id,referred_id" },
    );

    if (referralError) throw new Error(referralError.message);

    // Placeholder invite email notification.
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: null,
      type: "referral_invite",
      message: `Referral invite queued for ${referredEmail}.`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create referral",
      },
      { status: 500 },
    );
  }
}
