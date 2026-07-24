import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";
import { createJobSheetDocument } from "@/lib/business/documents";
import { runBookingCompletionRewards } from "@/lib/loyalty/onBookingCompleted";
import { logReputationEvent } from "@/lib/reputation/service";
import { logBehaviourEvent } from "@/lib/behaviour/service";

type CompleteBookingBody = {
  bookingId?: number | string;
};

export async function POST(request: Request) {
  let body: CompleteBookingBody;
  try {
    body = (await request.json()) as CompleteBookingBody;
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
      .update({ status: "completed" })
      .eq("id", bookingId)
      .select(
        "id, user_id, vendor_id, quote_id, preferred_date, job_sheet_document_id, payment_amount",
      )
      .single();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: bookingError.message },
        { status: 500 },
      );
    }

    await upsertCrmPipeline({
      vendorId: String(booking.vendor_id),
      bookingId,
      quoteId: Number(booking.quote_id),
      stage: "completed",
      probability: 100,
      metadata: { source: "api:bookings:complete" },
    });

    let jobSheetId = Number(booking.job_sheet_document_id ?? 0);
    if (!Number.isFinite(jobSheetId) || jobSheetId <= 0) {
      jobSheetId = await createJobSheetDocument({
        bookingId,
        vendorId: String(booking.vendor_id),
        userId: String(booking.user_id),
        serviceDescription: `Service completion for booking ${bookingId}`,
        dateTime: String(booking.preferred_date ?? new Date().toISOString()),
        location: "TBD",
        notes: "Auto-generated on completion",
      });
      await supabase
        .from("documents")
        .update({ booking_id: bookingId })
        .eq("id", jobSheetId);
    }

    await supabase
      .from("bookings")
      .update({ job_sheet_document_id: jobSheetId })
      .eq("id", bookingId);
    await supabase
      .from("vendor_calendar_events")
      .update({ status: "completed" })
      .eq("booking_id", bookingId)
      .neq("status", "cancelled");

    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      vendor_id: null,
      type: "job_completed",
      message: `Vendor marked booking ${bookingId} as completed. Please confirm completion.`,
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
      metadata: { bookingId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to complete booking",
      },
      { status: 500 },
    );
  }
}
