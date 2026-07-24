import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { getPaymentClient } from "@/lib/payments/client";

type CreateIntentBody = {
  bookingId?: number | string;
  amount?: number;
  currency?: string;
};

export async function POST(request: Request) {
  let body: CreateIntentBody;
  try {
    body = (await request.json()) as CreateIntentBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const bookingId = Number(body.bookingId);
  const amount = Number(body.amount);
  const currency = String(body.currency ?? "")
    .trim()
    .toLowerCase();

  if (
    !Number.isFinite(bookingId) ||
    bookingId <= 0 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !currency
  ) {
    return NextResponse.json(
      { ok: false, error: "bookingId, amount, currency are required" },
      { status: 400 },
    );
  }

  try {
    const paymentClient = getPaymentClient();
    const paymentIntent = await paymentClient.paymentIntents.create({
      amount,
      currency,
      metadata: {
        bookingId: String(bookingId),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("bookings")
      .update({
        payment_intent_id: paymentIntent.id,
        payment_amount: amount,
        payment_currency: currency,
      })
      .eq("id", bookingId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment intent",
      },
      { status: 500 },
    );
  }
}
