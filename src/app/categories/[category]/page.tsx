import type { Metadata } from "next";
import ListingCard from "@/components/listings/ListingCard";
import VendorCard from "@/components/vendors/VendorCard";
import RelatedIntents from "@/components/search/RelatedIntents";
import { createServiceClient } from "@/lib/db";
import { recordAdImpression, selectCategoryAds } from "@/lib/ads/biddingEngine";

export const dynamic = "force-dynamic";

type Params = { category: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const titleCase = category.replace(/-/g, " ");
  return {
    title: `${titleCase} Services - LocalHub`,
    description: `Top-rated ${titleCase} providers near you.`,
  };
}

function badgeFor(score: number): "gold" | "silver" | "bronze" | "none" {
  if (score >= 85) return "gold";
  if (score >= 70) return "silver";
  if (score >= 50) return "bronze";
  return "none";
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const supabase = createServiceClient();

  const { data: categoryRow } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", category)
    .maybeSingle();
  const categoryId = String(categoryRow?.id ?? "");

  const [
    { data: vendors },
    { data: listings },
    { data: trustRows },
    { data: reviewRows },
    { data: intents },
    { data: sponsorRows },
  ] = await Promise.all([
    categoryId
      ? supabase
          .from("seller_profiles")
          .select("id, business_name")
          .eq("category_id", categoryId)
      : Promise.resolve({
          data: [] as Array<{ id: string; business_name: string }>,
        }),
    categoryId
      ? supabase
          .from("listings")
          .select("id, seller_id, title, price, created_at")
          .eq("is_active", true)
          .eq("category_id", categoryId)
          .order("created_at", { ascending: false })
          .limit(12)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            seller_id: string;
            title: string;
            price: number;
            created_at: string;
          }>,
        }),
    supabase.from("vendor_trust_scores").select("vendor_id, trust_score"),
    supabase.from("reviews").select("vendor_id, rating"),
    supabase
      .from("intent_nodes")
      .select("id, keyword, intent, landing_path, score")
      .ilike("keyword", `%${category.replace(/-/g, " ")}%`)
      .order("score", { ascending: false })
      .limit(8),
    supabase
      .from("boosts")
      .select("vendor_id")
      .eq("status", "active")
      .eq("type", "category_sponsor")
      .eq("target", category)
      .gt("end_date", new Date().toISOString()),
  ]);

  const trustByVendor = new Map<string, number>(
    (trustRows ?? []).map((row) => [
      String(row.vendor_id),
      Number(row.trust_score) || 0,
    ]),
  );
  const ratingsByVendor = new Map<string, number[]>();
  (reviewRows ?? []).forEach((row) => {
    const vendorId = String((row as { vendor_id?: string }).vendor_id ?? "");
    ratingsByVendor.set(vendorId, [
      ...(ratingsByVendor.get(vendorId) ?? []),
      Number((row as { rating?: number }).rating) || 0,
    ]);
  });

  const sponsoredVendorSet = new Set(
    (sponsorRows ?? []).map((row) => String(row.vendor_id)),
  );
  const categoryAds = await selectCategoryAds(category, 3);
  await Promise.all(categoryAds.map((ad) => recordAdImpression(Number(ad.id))));
  const categoryAdVendorSet = new Set(
    categoryAds.map((ad) => String(ad.vendor_id)),
  );

  const topVendors = (vendors ?? [])
    .map((vendor) => {
      const vendorId = String(vendor.id);
      const ratings = ratingsByVendor.get(vendorId) ?? [];
      const avgRating = ratings.length
        ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
        : 0;
      return {
        vendorId,
        businessName: String(vendor.business_name ?? "Vendor"),
        trustBadge: badgeFor(trustByVendor.get(vendorId) ?? 0),
        averageRating: avgRating,
        serviceCategories: [String(categoryRow?.name ?? category)],
      };
    })
    .sort((a, b) => {
      const sponsorDelta =
        Number(sponsoredVendorSet.has(b.vendorId)) -
        Number(sponsoredVendorSet.has(a.vendorId));
      if (sponsorDelta !== 0) {
        return sponsorDelta;
      }
      return (
        (trustByVendor.get(b.vendorId) ?? 0) -
        (trustByVendor.get(a.vendorId) ?? 0)
      );
    })
    .slice(0, 8);

  const sponsoredAdVendors = topVendors.filter((vendor) =>
    categoryAdVendorSet.has(vendor.vendorId),
  );

  const vendorNameById = new Map<string, string>(
    topVendors.map((vendor) => [vendor.vendorId, vendor.businessName]),
  );

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">
        {categoryRow?.name ?? category.replace(/-/g, " ")} Services
      </h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Sponsored Vendors</h2>
        {sponsoredAdVendors.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">
              No sponsored vendors right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sponsoredAdVendors.map((vendor) => (
              <div key={`ad-${vendor.vendorId}`} className="space-y-1">
                <span className="badge bg-lh-warning/20 text-lh-warning">
                  Sponsored
                </span>
                <VendorCard {...vendor} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Top Vendors</h2>
        {topVendors.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">
              No vendors found for this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {topVendors.map((vendor) => (
              <VendorCard key={vendor.vendorId} {...vendor} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Top Listings</h2>
        {(listings ?? []).length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">
              No listings found for this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(listings ?? []).map((listing) => {
              const vendorId = String(listing.seller_id);
              return (
                <ListingCard
                  key={listing.id}
                  listingId={String(listing.id)}
                  title={String(listing.title)}
                  vendorId={vendorId}
                  vendorName={vendorNameById.get(vendorId) ?? "Vendor"}
                  trustBadge={badgeFor(trustByVendor.get(vendorId) ?? 0)}
                  priceRange={`R ${Math.round(Number(listing.price) * 0.85).toLocaleString("en-ZA")} - R ${Math.round(Number(listing.price) * 1.15).toLocaleString("en-ZA")}`}
                />
              );
            })}
          </div>
        )}
      </section>

      <RelatedIntents
        intents={
          (intents ?? []) as Array<{
            id: string;
            keyword: string;
            intent: string;
            landing_path: string;
          }>
        }
      />
    </section>
  );
}
