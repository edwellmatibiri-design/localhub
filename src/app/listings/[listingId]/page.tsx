import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/db";
import ListingCard from "@/components/listings/ListingCard";

type Params = {
  listingId: string;
};

type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category_id: string | null;
  created_at: string;
};

type SellerRow = {
  id: string;
  business_name: string;
  contact_email: string | null;
  contact_phone: string | null;
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

async function loadListingPageData(listingId: string) {
  const supabase = createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, seller_id, title, description, price, images, category_id, created_at",
    )
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) {
    return null;
  }

  const listingRow = listing as ListingRow;

  const [
    { data: vendor },
    { data: trust },
    { data: reviews },
    { data: related },
  ] = await Promise.all([
    supabase
      .from("seller_profiles")
      .select("id, business_name, contact_email, contact_phone")
      .eq("id", listingRow.seller_id)
      .maybeSingle(),
    supabase
      .from("vendor_trust_scores")
      .select("trust_score")
      .eq("vendor_id", listingRow.seller_id)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("rating")
      .eq("seller_id", listingRow.seller_id),
    supabase
      .from("listings")
      .select("id, seller_id, title, description, price")
      .eq("is_active", true)
      .eq("category_id", listingRow.category_id)
      .neq("id", listingId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (!vendor) {
    return null;
  }

  const trustScore = Number(trust?.trust_score ?? 0) || 0;
  const trustBadge = badgeFor(trustScore);
  const ratings = (reviews ?? []).map((row) => Number(row.rating) || 0);
  const reviewCount = ratings.length;
  const averageRating = reviewCount
    ? ratings.reduce((sum, rating) => sum + rating, 0) / reviewCount
    : 0;

  const relatedListings = (related ?? []) as Array<{
    id: string;
    seller_id: string;
    title: string;
    description: string;
    price: number;
  }>;

  const relatedVendorIds = Array.from(
    new Set(relatedListings.map((item) => item.seller_id).filter(Boolean)),
  );
  const { data: relatedVendors } = relatedVendorIds.length
    ? await supabase
        .from("seller_profiles")
        .select("id, business_name")
        .in("id", relatedVendorIds)
    : { data: [] as Array<{ id: string; business_name: string }> };

  const vendorNameById = new Map<string, string>(
    (relatedVendors ?? []).map((row) => [
      String(row.id),
      String(row.business_name),
    ]),
  );

  return {
    listing: listingRow,
    vendor: vendor as SellerRow,
    trustScore,
    trustBadge,
    reviewCount,
    averageRating,
    relatedListings,
    vendorNameById,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { listingId } = await params;
  const data = await loadListingPageData(listingId);

  if (!data) {
    return {
      title: "Listing - LocalHub",
      description: "LocalHub service listing.",
    };
  }

  return {
    title: `${data.listing.title} - LocalHub`,
    description: `Service by ${data.vendor.business_name}. Trust score: ${Math.round(data.trustScore)}.`,
  };
}

export default async function PublicListingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { listingId } = await params;
  const data = await loadListingPageData(listingId);

  if (!data) {
    notFound();
  }

  return (
    <section className="shell space-y-4 p-6">
      <header className="card space-y-2">
        <h1 className="text-2xl font-semibold">{data.listing.title}</h1>
        <p className="text-lh-muted text-sm">{data.listing.description}</p>
        <p className="text-sm font-medium">
          Price range: {formatPriceRange(Number(data.listing.price))}
        </p>

        <div className="grid gap-2 md:grid-cols-2">
          <p className="text-lh-muted text-sm">
            Vendor: {data.vendor.business_name}
          </p>
          <p className="text-lh-muted text-sm">
            Trust badge: <span className="capitalize">{data.trustBadge}</span>
          </p>
          <p className="text-lh-muted text-sm">
            Rating summary: {data.averageRating.toFixed(1)} average from{" "}
            {data.reviewCount} review{data.reviewCount === 1 ? "" : "s"}
          </p>
          <p className="text-lh-muted text-sm">
            Contact: {data.vendor.contact_email ?? "No email"} |{" "}
            {data.vendor.contact_phone ?? "No phone"}
          </p>
        </div>

        <Link
          href={`/vendors/${data.vendor.id}`}
          className="text-lh-accent inline-block text-sm font-medium hover:underline"
        >
          View vendor profile
        </Link>
        <Link
          href={`/vendors/${data.vendor.id}/quote`}
          className="bg-lh-accent text-lh-on-accent inline-block rounded-lg px-4 py-2 text-sm font-medium"
        >
          Contact Vendor
        </Link>
      </header>

      {Array.isArray(data.listing.images) && data.listing.images.length > 0 && (
        <section className="card space-y-2">
          <h2 className="text-lg font-semibold">Images</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.listing.images.map((imageUrl, index) => (
              <img
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                alt={`${data.listing.title} image ${index + 1}`}
                className="h-40 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Related listings</h2>
        {data.relatedListings.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No related listings found.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.relatedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listingId={listing.id}
                title={listing.title}
                vendorId={listing.seller_id}
                vendorName={
                  data.vendorNameById.get(listing.seller_id) ?? "Vendor"
                }
                trustBadge="none"
                priceRange={formatPriceRange(Number(listing.price))}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
