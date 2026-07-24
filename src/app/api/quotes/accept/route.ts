import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";
import { createInvoiceDraft } from "@/lib/business/invoices";
import { createJobSheetDocument } from "@/lib/business/documents";
import {
  ensureTrustProfile,
  recalculateAndPersistTrustScore,
  refreshCancellationAndDispute,
} from "@/lib/trust/profile";
import { ensureUserReputation } from "@/lib/reputation/service";
import { getReputationTier } from "@/lib/reputation/tiers";
import { logBehaviourEvent } from "@/lib/behaviour/service";

type AcceptBody = {
  quoteId?: string;
};

export async function POST(request: Request) {
  let body: AcceptBody;
  try {
    body = (await request.json()) as AcceptBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const quoteId = String(body.quoteId ?? "").trim();
  if (!quoteId) {
    return NextResponse.json(
      { ok: false, error: "quoteId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId)
      .select("id, vendor_id, user_id, preferred_date")
      .single();

    if (quoteError) {
      return NextResponse.json(
        { ok: false, error: quoteError.message },
        { status: 500 },
      );
    }

    await ensureTrustProfile(String(quote.user_id));
    await refreshCancellationAndDispute(String(quote.user_id));
    await recalculateAndPersistTrustScore(
      String(quote.user_id),
      "quote_accept_booking_flow",
    );

    const { data: userTrust } = await supabase
      .from("user_trust_profile")
      .select("trust_score, bookings_locked, phone_verified, email_verified")
      .eq("user_id", quote.user_id)
      .maybeSingle();

    const trustScore = Number(userTrust?.trust_score ?? 50);
    if (Boolean(userTrust?.bookings_locked)) {
      return NextResponse.json(
        { ok: false, error: "User bookings are locked by admin" },
        { status: 403 },
      );
    }

    const reputation = await ensureUserReputation(String(quote.user_id));
    const reputationScore = Number(reputation.reputation_score ?? 50);
    const reputationTier = getReputationTier(reputationScore);

    const { data: vendorProfile } = await supabase
      .from("seller_profiles")
      .select("id, auto_accept_trusted_bookings")
      .eq("id", quote.vendor_id)
      .maybeSingle();

    const autoAcceptTrusted = Boolean(
      vendorProfile?.auto_accept_trusted_bookings,
    );
    const requiresVendorApproval =
      trustScore < 10 || reputationTier === "High Risk";
    const autoAccepted =
      (reputationTier === "Trusted" || reputationTier === "Premium") &&
      autoAcceptTrusted;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        quote_id: quote.id,
        vendor_id: quote.vendor_id,
        user_id: quote.user_id,
        preferred_date: quote.preferred_date,
        status: autoAccepted ? "confirmed" : "new",
        requires_vendor_approval: autoAccepted ? false : requiresVendorApproval,
      })
      .select("id")
      .single();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: bookingError.message },
        { status: 500 },
      );
    }

    await createInvoiceDraft({
      vendorId: String(quote.vendor_id),
      userId: String(quote.user_id),
      bookingId: Number(booking.id),
      items: [
        {
          description: String("Service as per accepted quote"),
          qty: 1,
          price: 1000,
        },
      ],
    });

    const jobSheetId = await createJobSheetDocument({
      bookingId: Number(booking.id),
      vendorId: String(quote.vendor_id),
      userId: String(quote.user_id),
      serviceDescription: String("Service delivery from accepted quote"),
      dateTime: String(quote.preferred_date ?? new Date().toISOString()),
      location: "TBD",
      notes: String(quote.id),
    });

    await supabase
      .from("documents")
      .update({ booking_id: booking.id })
      .eq("id", jobSheetId);
    await supabase
      .from("bookings")
      .update({ job_sheet_document_id: jobSheetId })
      .eq("id", booking.id);

    await upsertCrmPipeline({
      vendorId: String(quote.vendor_id),
      quoteId: Number(quote.id),
      bookingId: Number(booking.id),
      stage: "awaiting_payment",
      probability: 75,
      metadata: { source: "api:quotes:accept" },
    });

    await supabase.from("notifications").insert([
      {
        user_id: quote.user_id,
        vendor_id: null,
        type: "quote_accepted",
        message: `Your quote ${quote.id} was accepted. Booking ${booking.id} was created. Pay at /bookings/${booking.id}/pay.`,
      },
      {
        user_id: null,
        vendor_id: quote.vendor_id,
        type:
          reputationTier === "High Risk"
            ? "user_low_trust"
            : reputationTier === "Low Reputation"
              ? "user_low_reputation"
              : reputationTier === "Trusted"
                ? "user_trusted"
                : reputationTier === "Premium"
                  ? "user_premium"
                  : "user_verified",
        message:
          reputationTier === "High Risk"
            ? `Booking ${booking.id} requires approval for High Risk user ${quote.user_id}.`
            : reputationTier === "Low Reputation"
              ? `Booking ${booking.id} created for Low Reputation user ${quote.user_id}.`
              : reputationTier === "Trusted"
                ? `Booking ${booking.id} created for Trusted User ${quote.user_id}.`
                : reputationTier === "Premium"
                  ? `Booking ${booking.id} created for Premium User ${quote.user_id}. Faster response expected.`
                  : `Booking ${booking.id} created for user ${quote.user_id}.`,
      },
    ]);

    if (requiresVendorApproval) {
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: "admin",
        type: "high_risk_user_detected",
        message: `Booking ${booking.id} requires vendor approval due to low trust user ${quote.user_id}.`,
      });
    }

    if (autoAccepted) {
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: String(quote.vendor_id),
        type: "booking_auto_accepted",
        message: `Booking ${booking.id} auto-accepted for ${reputationTier} user ${quote.user_id}.`,
      });
    }

    await logBehaviourEvent({
      userId: String(quote.user_id),
      type: "booking_started",
      metadata: { bookingId: Number(booking.id), autoAccepted },
    });

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      paymentUrl: `/bookings/${booking.id}/pay`,
      notification: "Notifications created",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to accept quote",
      },
      { status: 500 },
    );
  }
}
