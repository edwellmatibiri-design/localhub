import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";
import { markInvoicePaidByBookingId } from "@/lib/business/invoices";
import {
  ensureTrustProfile,
  recalculateAndPersistTrustScore,
  refreshCancellationAndDispute,
} from "@/lib/trust/profile";
import { markDeviceVerifiedAfterSuccessfulBooking } from "@/lib/identity/deviceFingerprint";
import { evaluateSmartAcceptance } from "@/lib/vendor/smartAcceptance";
import { calculateLeadQualityScore } from "@/lib/predictive/leadScore";
import { ensureUserReputation } from "@/lib/reputation/service";
import { ensureUserBehaviour } from "@/lib/behaviour/service";

type ConfirmBookingBody = {
  bookingId?: number | string;
  deviceHash?: string;
};

export async function POST(request: Request) {
  let body: ConfirmBookingBody;
  try {
    body = (await request.json()) as ConfirmBookingBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const bookingId = Number(body.bookingId);
  const deviceHash = String(body.deviceHash ?? "").trim();
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
        "id, vendor_id, quote_id, user_id, preferred_date, requires_vendor_approval",
      )
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: bookingError.message },
        { status: 500 },
      );
    }

    await ensureTrustProfile(String(booking.user_id));
    await refreshCancellationAndDispute(String(booking.user_id));
    await recalculateAndPersistTrustScore(
      String(booking.user_id),
      "booking_confirm",
    );

    const { data: trustProfile } = await supabase
      .from("user_trust_profile")
      .select("trust_score, bookings_locked, cancellation_rate")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    const trustScore = Number(trustProfile?.trust_score ?? 50);

    const reputation = await ensureUserReputation(String(booking.user_id));
    const behaviour = await ensureUserBehaviour(String(booking.user_id));
    const leadQualityScore = calculateLeadQualityScore({
      bookings_completed: Number(behaviour.bookings_completed ?? 0),
      leads_responded: Number(behaviour.leads_responded ?? 0),
      messages_sent: Number(behaviour.messages_sent ?? 0),
      bookings_cancelled: Number(behaviour.bookings_cancelled ?? 0),
      avg_response_time: Number(behaviour.avg_response_time ?? 0),
      trust_score: trustScore,
      reputation_score: Number(reputation.reputation_score ?? 50),
      cancellation_rate: Number(trustProfile?.cancellation_rate ?? 0),
      response_time: Number(behaviour.avg_response_time ?? 0),
    });

    const smartAcceptance = evaluateSmartAcceptance({
      trustScore,
      reputationScore: Number(reputation.reputation_score ?? 50),
      leadQualityScore,
    });

    if (Boolean(trustProfile?.bookings_locked)) {
      return NextResponse.json(
        { ok: false, error: "Bookings are locked for this user" },
        { status: 403 },
      );
    }

    const nextStatus = smartAcceptance.autoAccept ? "confirmed" : "new";
    const requiresApproval =
      !smartAcceptance.autoAccept || Boolean(booking.requires_vendor_approval);

    const { error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({
        status: nextStatus,
        requires_vendor_approval: requiresApproval,
      })
      .eq("id", bookingId);

    if (bookingUpdateError) {
      return NextResponse.json(
        { ok: false, error: bookingUpdateError.message },
        { status: 500 },
      );
    }

    if (
      !smartAcceptance.autoAccept ||
      trustScore < 10 ||
      Boolean(booking.requires_vendor_approval)
    ) {
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: String(booking.vendor_id),
        type: "manual_approval_required",
        message: `Booking ${bookingId} requires manual vendor approval. ${smartAcceptance.reason}`,
      });
    }

    await upsertCrmPipeline({
      vendorId: String(booking.vendor_id),
      bookingId,
      quoteId: Number(booking.quote_id),
      stage: smartAcceptance.autoAccept ? "booked" : "awaiting_payment",
      probability: smartAcceptance.autoAccept ? 95 : 65,
      metadata: {
        source: "api:bookings:confirm",
        smartAcceptance,
        leadQualityScore,
      },
    });

    await markInvoicePaidByBookingId(bookingId);

    const startAt = String(booking.preferred_date ?? new Date().toISOString());
    const endAt = new Date(Date.parse(startAt) + 90 * 60 * 1000).toISOString();
    await supabase.from("vendor_calendar_events").insert({
      vendor_id: String(booking.vendor_id),
      staff_id: null,
      booking_id: bookingId,
      title: `Booking ${bookingId}`,
      description: "Auto-created on booking confirmation",
      start_at: startAt,
      end_at: endAt,
      status: "scheduled",
    });

    await supabase.from("notifications").insert({
      user_id: String(booking.user_id),
      vendor_id: null,
      type: smartAcceptance.autoAccept
        ? "job_scheduled"
        : "booking_pending_approval",
      message: smartAcceptance.autoAccept
        ? `Your job has been scheduled for ${startAt}.`
        : `Booking ${bookingId} is pending vendor approval.`,
    });

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await fetch(`${origin}/api/payouts/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId }),
    });

    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: booking.vendor_id,
      type: "job_confirmed",
      message: `User confirmed completion for booking ${bookingId}.`,
    });

    if (deviceHash) {
      await markDeviceVerifiedAfterSuccessfulBooking({
        userId: String(booking.user_id),
        deviceHash,
      });
    }

    return NextResponse.json({
      ok: true,
      autoAccept: smartAcceptance.autoAccept,
      reason: smartAcceptance.reason,
      leadQualityScore,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to confirm booking",
      },
      { status: 500 },
    );
  }
}
