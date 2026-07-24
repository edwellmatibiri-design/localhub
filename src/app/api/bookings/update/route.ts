import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";
import { runBookingCompletionRewards } from "@/lib/loyalty/onBookingCompleted";
import { logReputationEvent } from "@/lib/reputation/service";
import { logBehaviourEvent } from "@/lib/behaviour/service";

type BookingUpdateBody = {
  bookingId?: string;
  newStatus?: "new" | "confirmed" | "completed" | "cancelled";
};

const ALLOWED_STATUSES = new Set([
  "new",
  "confirmed",
  "completed",
  "cancelled",
]);

export async function POST(request: Request) {
  let body: BookingUpdateBody;
  try {
    body = (await request.json()) as BookingUpdateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const bookingId = String(body.bookingId ?? "").trim();
  const newStatus = String(body.newStatus ?? "").trim();

  if (!bookingId || !newStatus) {
    return NextResponse.json(
      { ok: false, error: "bookingId and newStatus are required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_STATUSES.has(newStatus)) {
    return NextResponse.json(
      { ok: false, error: "Invalid booking status" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId)
      .select("id, vendor_id, quote_id, user_id, payment_amount")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    if (booking?.id && booking?.vendor_id) {
      if (newStatus === "confirmed") {
        await upsertCrmPipeline({
          vendorId: String(booking.vendor_id),
          bookingId: Number(booking.id),
          quoteId: Number(booking.quote_id),
          stage: "booked",
          probability: 95,
          metadata: { source: "api:bookings:update" },
        });
      }

      if (newStatus === "completed") {
        await upsertCrmPipeline({
          vendorId: String(booking.vendor_id),
          bookingId: Number(booking.id),
          quoteId: Number(booking.quote_id),
          stage: "completed",
          probability: 100,
          metadata: { source: "api:bookings:update" },
        });

        await runBookingCompletionRewards({
          userId: String(booking.user_id),
          paymentAmount: Number(booking.payment_amount ?? 0),
        });

        await logReputationEvent({
          userId: String(booking.user_id),
          type: "booking_completed",
        });

        await logBehaviourEvent({
          userId: String(booking.user_id),
          type: "booking_completed",
          metadata: { bookingId: Number(booking.id) },
        });
      }

      if (newStatus === "cancelled") {
        await logReputationEvent({
          userId: String(booking.user_id),
          type: "booking_cancelled",
        });

        await logBehaviourEvent({
          userId: String(booking.user_id),
          type: "booking_cancelled",
          metadata: { bookingId: Number(booking.id) },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update booking",
      },
      { status: 500 },
    );
  }
}
