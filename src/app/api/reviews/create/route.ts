import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { computeTrustScore } from "@/lib/vendor/computeTrustScore";
import { awardPoints } from "@/lib/loyalty/awardPoints";
import { syncUserBadges } from "@/lib/loyalty/badges";

type CreateReviewBody = {
  vendorId?: string;
  userId?: string;
  bookingId?: number | string;
  rating?: number;
  review?: string;
};

const BANNED_KEYWORDS = ["scam", "fraud", "fake", "stolen", "abuse"];

function hasBannedKeyword(text: string) {
  const normalized = text.toLowerCase();
  return BANNED_KEYWORDS.some((word) => normalized.includes(word));
}

export async function POST(request: Request) {
  let body: CreateReviewBody;
  try {
    body = (await request.json()) as CreateReviewBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const vendorId = String(body.vendorId ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const bookingId = Number(body.bookingId);
  const rating = Number(body.rating ?? 0);
  const review = String(body.review ?? "").trim();

  if (
    !vendorId ||
    !userId ||
    !Number.isFinite(bookingId) ||
    bookingId <= 0 ||
    rating < 1 ||
    rating > 5 ||
    !review
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "vendorId, userId, bookingId, rating (1-5), review are required",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, vendor_id, status")
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

    if (String(booking.user_id) !== userId) {
      return NextResponse.json(
        { ok: false, error: "User is not the booking owner" },
        { status: 403 },
      );
    }

    if (String(booking.vendor_id) !== vendorId) {
      return NextResponse.json(
        { ok: false, error: "bookingId does not match vendor" },
        { status: 400 },
      );
    }

    const bookingStatus = String(booking.status);
    if (bookingStatus !== "completed" && bookingStatus !== "confirmed") {
      return NextResponse.json(
        { ok: false, error: "Booking must be completed or confirmed" },
        { status: 400 },
      );
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentByUser, error: recentError } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", since);

    if (recentError) {
      return NextResponse.json(
        { ok: false, error: recentError.message },
        { status: 500 },
      );
    }

    const userReviewCount24h = (recentByUser ?? []).length;
    const autoFlagTooMany = userReviewCount24h >= 3;
    const autoFlagKeywords = hasBannedKeyword(review);
    const needsExtraVerification = rating === 1 || rating === 5;

    const verified = !(
      autoFlagTooMany ||
      autoFlagKeywords ||
      needsExtraVerification
    );

    const { data: inserted, error: insertError } = await supabase
      .from("reviews")
      .insert({
        vendor_id: vendorId,
        user_id: userId,
        booking_id: bookingId,
        rating,
        review,
        verified,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 },
      );
    }

    const { data: vendorReviews, error: vendorReviewsError } = await supabase
      .from("reviews")
      .select("rating, created_at, verified")
      .eq("vendor_id", vendorId);

    if (vendorReviewsError) {
      return NextResponse.json(
        { ok: false, error: vendorReviewsError.message },
        { status: 500 },
      );
    }

    const rows = vendorReviews ?? [];
    const reviewCount = rows.length;
    const averageRating = reviewCount
      ? Number(
          (
            rows.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) /
            reviewCount
          ).toFixed(2),
        )
      : 0;

    const threshold = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const recentReviews = rows.filter((row) => {
      const parsed = Date.parse(String(row.created_at));
      return !Number.isNaN(parsed) && parsed >= threshold;
    }).length;

    const trustScore = computeTrustScore({
      averageRating,
      reviewCount,
      recentReviews,
      profileCompleteness: 100,
      disputeCount: rows.filter((row) => !row.verified).length,
    });

    await supabase.from("vendor_trust_scores").upsert(
      {
        vendor_id: vendorId,
        trust_score: trustScore,
        signals: {
          averageRating,
          reviewCount,
          recentReviews,
          recomputedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "vendor_id" },
    );

    await awardPoints({
      userId,
      type: "review_written",
    });
    await syncUserBadges(userId);

    return NextResponse.json({ ok: true, reviewId: inserted.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create review",
      },
      { status: 500 },
    );
  }
}
