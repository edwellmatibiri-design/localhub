import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/db";
import ListingCard from "@/components/listings/ListingCard";
import ReviewsSection from "@/components/vendor/ReviewsSection";
import ReviewCard from "@/components/reviews/ReviewCard";

type Params = {
  vendorId: string;
};

type SellerProfileRow = {
  id: string;
  business_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  description: string;
  category_id: string | null;
  suburb_id: string | null;
};

type ListingRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category_id: string | null;
  suburb_id: string | null;
};

type VendorReviewRow = {
  id: number;
  rating: number;
  review: string;
  created_at: string;
  verified: boolean;
};

function badgeFor(score: number): "gold" | "silver" | "bronze" | "none" {
  if (score >= 85) return "gold";
  if (score >= 70) return "silver";
  if (score >= 50) return "bronze";
  return "none";
}

function formatPriceRange(price: number | null | undefined) {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return "Contact for pricing";
  }

  const rounded = Math.max(0, Math.round(price));
  const lower = Math.max(0, rounded - Math.round(rounded * 0.15));
  const upper = rounded + Math.round(rounded * 0.15);
  return `R ${lower.toLocaleString("en-ZA")} - R ${upper.toLocaleString("en-ZA")}`;
}

async function loadVendorData(vendorId: string) {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("seller_profiles")
    .select(
      "id, business_name, contact_email, contact_phone, description, category_id, suburb_id",
    )
    .eq("id", vendorId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const [{ data: trust }, { data: listings }, { data: reviewRows }] =
    await Promise.all([
      supabase
        .from("vendor_trust_scores")
        .select("trust_score")
        .eq("vendor_id", vendorId)
        .maybeSingle(),
      supabase
        .from("listings")
        .select("id, title, description, price, images, category_id, suburb_id")
        .eq("seller_id", vendorId)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("id, rating, review, created_at, verified")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false }),
    ]);

  const listingRows = (listings ?? []) as ListingRow[];
  const categoryIds = Array.from(
    new Set(
      [
        profile.category_id,
        ...listingRows.map((item) => item.category_id),
      ].filter(Boolean),
    ),
  );
  const suburbIds = Array.from(
    new Set(
      [profile.suburb_id, ...listingRows.map((item) => item.suburb_id)].filter(
        Boolean,
      ),
    ),
  );

  const [{ data: categories }, { data: suburbs }] = await Promise.all([
    categoryIds.length
      ? supabase
          .from("categories")
          .select("id, name")
          .in("id", categoryIds as string[])
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    suburbIds.length
      ? supabase
          .from("suburbs")
          .select("id, name, city")
          .in("id", suburbIds as string[])
      : Promise.resolve({
          data: [] as Array<{ id: string; name: string; city: string }>,
        }),
  ]);

  const categoryNameById = new Map<string, string>(
    (categories ?? []).map((row) => [String(row.id), String(row.name)]),
  );
  const suburbLabelById = new Map<string, string>(
    (suburbs ?? []).map((row) => [String(row.id), `${row.name}, ${row.city}`]),
  );

  const serviceCategories = Array.from(
    new Set(
      [profile.category_id, ...listingRows.map((item) => item.category_id)]
        .filter((id): id is string => typeof id === "string")
        .map((id) => categoryNameById.get(id) ?? "")
        .filter(Boolean),
    ),
  );

  const serviceAreas = Array.from(
    new Set(
      [profile.suburb_id, ...listingRows.map((item) => item.suburb_id)]
        .filter((id): id is string => typeof id === "string")
        .map((id) => suburbLabelById.get(id) ?? "")
        .filter(Boolean),
    ),
  );

  const trustScore = Number(trust?.trust_score ?? 0) || 0;
  const badge = badgeFor(trustScore);

  const reviews = (reviewRows ?? []) as VendorReviewRow[];
  const ratingValues = reviews.map((row) => Number(row.rating) || 0);
  const reviewCount = ratingValues.length;
  const averageRating = reviewCount
    ? ratingValues.reduce((sum, value) => sum + value, 0) / reviewCount
    : 0;

  return {
    profile: profile as SellerProfileRow,
    trustScore,
    badge,
    serviceCategories,
    serviceAreas,
    averageRating,
    reviewCount,
    recentReviews: reviews.slice(0, 3),
    listings: listingRows,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { vendorId } = await params;
  const data = await loadVendorData(vendorId);

  if (!data) {
    return {
      title: "Vendor Profile - LocalHub",
      description: "LocalHub vendor profile.",
    };
  }

  const categoriesLabel = data.serviceCategories.length
    ? data.serviceCategories.join(", ")
    : "local services";
  const areasLabel = data.serviceAreas.length
    ? data.serviceAreas.join(", ")
    : "your area";

  return {
    title: `${data.profile.business_name} - LocalHub`,
    description: `Trusted ${categoriesLabel} provider in ${areasLabel}.`,
  };
}

export default async function VendorPublicProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { vendorId } = await params;
  const data = await loadVendorData(vendorId);

  if (!data) {
    notFound();
  }

  const supabase = createServiceClient();
  const primaryCategory = String(data.serviceCategories?.[0] ?? "")
    .trim()
    .toLowerCase();
  const primaryArea = String(data.serviceAreas?.[0] ?? "")
    .split(",")[0]
    ?.trim()
    .toLowerCase();
  const guideFilter = [
    primaryCategory ? `category.eq.${primaryCategory}` : "",
    primaryArea ? `location.eq.${primaryArea}` : "",
  ]
    .filter(Boolean)
    .join(",");

  let guidesQuery = supabase
    .from("content_guides")
    .select("id, title, slug")
    .order("updated_at", { ascending: false })
    .limit(6);

  if (guideFilter) {
    guidesQuery = guidesQuery.or(guideFilter);
  }

  const { data: relatedGuides } = await guidesQuery;

  return (
    <section className="shell space-y-4 p-6">
      <header className="card space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">
            {data.profile.business_name}
          </h1>
          <span className="badge bg-lh-accent/10 text-lh-accent capitalize">
            {data.badge}
          </span>
        </div>
        <p className="text-lh-muted text-sm">
          Trust score: {Math.round(data.trustScore)}
        </p>
        <p className="text-lh-muted text-sm">
          Email: {data.profile.contact_email ?? "Not provided"}
        </p>
        <p className="text-lh-muted text-sm">
          Phone: {data.profile.contact_phone ?? "Not provided"}
        </p>
        <p className="text-sm">
          {data.profile.description || "No business description yet."}
        </p>
        <p className="text-lh-muted text-sm">
          Service categories:{" "}
          {data.serviceCategories.length
            ? data.serviceCategories.join(", ")
            : "General"}
        </p>
        <p className="text-lh-muted text-sm">
          Service areas:{" "}
          {data.serviceAreas.length
            ? data.serviceAreas.join(" | ")
            : "Area not listed"}
        </p>
        <p className="text-lh-muted text-sm">
          Reviews summary: {data.averageRating.toFixed(1)} average from{" "}
          {data.reviewCount} review{data.reviewCount === 1 ? "" : "s"}
        </p>
        <div>
          <Link
            href={`/vendors/${vendorId}/quote`}
            className="bg-lh-accent text-lh-on-accent inline-block rounded-lg px-4 py-2 text-sm font-medium"
          >
            Request Quote
          </Link>
        </div>
      </header>

      <ReviewsSection vendorId={vendorId} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Top recent reviews</h2>
        {data.recentReviews.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No recent reviews yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {data.recentReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Listings</h2>
        {data.listings.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No active listings.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listingId={listing.id}
                title={listing.title}
                vendorId={vendorId}
                vendorName={data.profile.business_name}
                trustBadge={data.badge}
                priceRange={formatPriceRange(Number(listing.price))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Learn more about this service</h2>
        {(relatedGuides ?? []).length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">
              No guides yet for this service.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {(relatedGuides ?? []).map((guide) => (
              <Link
                key={guide.id}
                href={`/guides/${guide.slug}`}
                className="card hover:border-lh-accent/40"
              >
                <p className="text-sm font-medium">{guide.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
