import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { getPaymentClient } from "@/lib/payments/client";

type ActivateBody = {
  boostId?: number | string;
  paymentIntentId?: string;
};

export async function POST(request: Request) {
  let body: ActivateBody;
  try {
    body = (await request.json()) as ActivateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const boostId = Number(body.boostId);
  const paymentIntentId = String(body.paymentIntentId ?? "").trim();

  if (!Number.isFinite(boostId) || boostId <= 0 || !paymentIntentId) {
    return NextResponse.json(
      { ok: false, error: "boostId and paymentIntentId are required" },
      { status: 400 },
    );
  }

  try {
    const paymentClient = getPaymentClient();
    const paymentIntent =
      await paymentClient.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { ok: false, error: `Payment not successful: ${paymentIntent.status}` },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .select("id, start_date, end_date, status")
      .eq("id", boostId)
      .maybeSingle();

    if (boostError) {
      return NextResponse.json(
        { ok: false, error: boostError.message },
        { status: 500 },
      );
    }

    if (!boost) {
      return NextResponse.json(
        { ok: false, error: "Boost not found" },
        { status: 404 },
      );
    }

    const previousStart = Date.parse(String(boost.start_date ?? ""));
    const previousEnd = Date.parse(String(boost.end_date ?? ""));
    const defaultDurationMs = 7 * 24 * 60 * 60 * 1000;
    const durationMs =
      Number.isFinite(previousStart) &&
      Number.isFinite(previousEnd) &&
      previousEnd > previousStart
        ? previousEnd - previousStart
        : defaultDurationMs;

    const now = new Date();
    const nextEnd = new Date(now.getTime() + durationMs).toISOString();

    const { error: updateError } = await supabase
      .from("boosts")
      .update({
        status: "active",
        start_date: now.toISOString(),
        end_date: nextEnd,
      })
      .eq("id", boostId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to activate boost",
      },
      { status: 500 },
    );
  }
}
