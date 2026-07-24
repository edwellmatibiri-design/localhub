import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { getPaymentClient } from "@/lib/payments/client";
import { regenerateCurrentMonthStatement } from "@/lib/financial/metrics";

type ProcessBody = {
  bookingId?: number | string;
};

export async function POST(request: Request) {
  try {
    let body: ProcessBody = {};
    try {
      body = (await request.json()) as ProcessBody;
    } catch {
      body = {};
    }

    const bookingId = Number(body.bookingId);

    const supabase = createServiceClient();
    let query = supabase
      .from("payouts")
      .select("id, vendor_id, booking_id, amount, status")
      .eq("status", "pending");

    if (Number.isFinite(bookingId) && bookingId > 0) {
      query = query.eq("booking_id", bookingId);
    }

    const { data: payouts, error: payoutsError } = await query;

    if (payoutsError) {
      return NextResponse.json(
        { ok: false, error: payoutsError.message },
        { status: 500 },
      );
    }

    let processed = 0;
    let paid = 0;
    let failed = 0;

    for (const payout of payouts ?? []) {
      processed += 1;

      try {
        const vendorDestination = String(payout.vendor_id ?? "");
        if (!vendorDestination.startsWith("acct_")) {
          throw new Error("Vendor has no connected Stripe account id");
        }

        const paymentClient = getPaymentClient();
        await paymentClient.transfers.create({
          amount: Number(payout.amount ?? 0),
          currency: "zar",
          destination: vendorDestination,
          metadata: {
            payoutId: String(payout.id),
            bookingId: String(payout.booking_id),
          },
        });

        await supabase
          .from("payouts")
          .update({ status: "paid" })
          .eq("id", payout.id);
        await regenerateCurrentMonthStatement(String(payout.vendor_id));
        await supabase.from("notifications").insert({
          user_id: null,
          vendor_id: String(payout.vendor_id),
          type: "payout_completed",
          message: `Payout completed for booking ${payout.booking_id}.`,
        });
        paid += 1;
      } catch {
        await supabase
          .from("payouts")
          .update({ status: "failed" })
          .eq("id", payout.id);
        failed += 1;
      }
    }

    return NextResponse.json({ ok: true, processed, paid, failed });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to process payouts",
      },
      { status: 500 },
    );
  }
}
