import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import {
  computeTrustScore,
  type VendorTrustSignals,
} from "@/lib/vendor/computeTrustScore";

type Body = {
  vendorId?: string;
};

type SellerProfile = {
  id: string;
  business_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  category_id: string | null;
  suburb_id: string | null;
  description: string | null;
  logo_url: string | null;
};

type ReviewRow = {
  rating: number;
  created_at: string;
  verified: boolean;
};

function isPopulated(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

function computeProfileCompleteness(profile: SellerProfile) {
  const fields = [
    profile.business_name,
    profile.contact_email,
    profile.contact_phone,
    profile.category_id,
    profile.suburb_id,
    profile.description,
    profile.logo_url,
  ];
  const populated = fields.filter(isPopulated).length;
  return Math.round((populated / fields.length) * 100);
}

function computeSignals(
  profile: SellerProfile,
  reviews: ReviewRow[],
): VendorTrustSignals {
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? Number(
        (
          reviews.reduce((sum, row) => sum + (Number(row.rating) || 0), 0) /
          reviewCount
        ).toFixed(2),
      )
    : 0;

  const threshold = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recentReviews = reviews.filter((row) => {
    const created = Date.parse(String(row.created_at));
    return !Number.isNaN(created) && created >= threshold;
  }).length;

  const disputeCount = reviews.filter((row) => !row.verified).length;
  const profileCompleteness = computeProfileCompleteness(profile);

  return {
    averageRating,
    reviewCount,
    recentReviews,
    profileCompleteness,
    disputeCount,
  };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const vendorId = String(body.vendorId ?? "").trim();
  if (!vendorId) {
    return NextResponse.json(
      { error: "vendorId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from("seller_profiles")
      .select(
        "id, business_name, contact_email, contact_phone, category_id, suburb_id, description, logo_url",
      )
      .eq("id", vendorId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("rating, created_at, verified")
      .eq("vendor_id", vendorId);

    if (reviewsError) {
      return NextResponse.json(
        { error: reviewsError.message },
        { status: 500 },
      );
    }

    const signals = computeSignals(
      profile as SellerProfile,
      (reviews ?? []) as ReviewRow[],
    );
    const trustScore = computeTrustScore(signals);

    return NextResponse.json({
      vendorId,
      trustScore,
      signals,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to compute vendor trust",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
