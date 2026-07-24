import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { getPaymentClient } from "@/lib/payments/client";

type RefundBody = {
  bookingId?: number | string;
};

export async function POST(request: Request) {
  let body: RefundBody;
  try {
    body = (await request.json()) as RefundBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const bookingId = Number(body.bookingId);
  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    return NextResponse.json(
      { ok: false, error: "bookingId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, user_id, vendor_id, status, payment_intent_id, payment_amount",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: bookingError.message },
        { status: 500 },
      );
    }

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    if (String(booking.status) !== "paid") {
      return NextResponse.json(
        { ok: false, error: "Only paid bookings can be refunded" },
        { status: 400 },
      );
    }

    const paymentIntentId = String(booking.payment_intent_id ?? "").trim();
    if (!paymentIntentId) {
      return NextResponse.json(
        { ok: false, error: "Booking has no payment intent" },
        { status: 400 },
      );
    }

    const paymentClient = getPaymentClient();
    await paymentClient.refunds.create({ payment_intent: paymentIntentId });

    const { error: refundError } = await supabase.from("refunds").insert({
      booking_id: bookingId,
      amount: Number(booking.payment_amount ?? 0),
      status: "processed",
    });

    if (refundError) {
      return NextResponse.json(
        { ok: false, error: refundError.message },
        { status: 500 },
      );
    }

    const { error: statusError } = await supabase
      .from("bookings")
      .update({ status: "refunded" })
      .eq("id", bookingId);
    if (statusError) {
      return NextResponse.json(
        { ok: false, error: statusError.message },
        { status: 500 },
      );
    }

    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      vendor_id: null,
      type: "refund_processed",
      message: `Refund processed for booking ${bookingId}.`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to process refund",
      },
      { status: 500 },
    );
  }
}
