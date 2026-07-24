import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { getPaymentClient } from "@/lib/payments/client";
import { logReputationEvent } from "@/lib/reputation/service";
import { logBehaviourEvent } from "@/lib/behaviour/service";

type ConfirmBody = {
  bookingId?: number | string;
  paymentIntentId?: string;
};

export async function POST(request: Request) {
  let body: ConfirmBody;
  try {
    body = (await request.json()) as ConfirmBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const bookingId = Number(body.bookingId);
  const paymentIntentId = String(body.paymentIntentId ?? "").trim();

  if (!Number.isFinite(bookingId) || bookingId <= 0 || !paymentIntentId) {
    return NextResponse.json(
      { ok: false, error: "bookingId and paymentIntentId are required" },
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
    const amount = Number(
      paymentIntent.amount_received || paymentIntent.amount || 0,
    );

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .update({ status: "paid" })
      .eq("id", bookingId)
      .select("id, vendor_id, user_id")
      .single();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: bookingError.message },
        { status: 500 },
      );
    }

    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        vendor_id: booking.vendor_id,
        booking_id: booking.id,
        amount,
        status: "pending",
      })
      .select("id")
      .single();

    if (payoutError) {
      return NextResponse.json(
        { ok: false, error: payoutError.message },
        { status: 500 },
      );
    }

    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: booking.vendor_id,
      type: "payment_succeeded",
      message: `New paid booking ${booking.id} is ready for fulfillment.`,
    });

    await logReputationEvent({
      userId: String(booking.user_id),
      type: "payment_on_time",
    });

    await logBehaviourEvent({
      userId: String(booking.user_id),
      type: "booking_started",
      metadata: { bookingId: Number(booking.id), paymentIntentId },
    });

    return NextResponse.json({ ok: true, payoutId: payout.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to confirm payment",
      },
      { status: 500 },
    );
  }
}
