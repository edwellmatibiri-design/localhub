import ListingCard from "@/components/listings/ListingCard";
import { createServiceClient } from "@/lib/db";

type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  created_at: string;
};

function badgeFor(score: number): "gold" | "silver" | "bronze" | "none" {
  if (score >= 85) return "gold";
  if (score >= 70) return "silver";
  if (score >= 50) return "bronze";
  return "none";
}

function priceRange(price: number) {
  const lower = Math.max(0, Math.round(price * 0.85));
  const upper = Math.round(price * 1.15);
  return `R ${lower.toLocaleString("en-ZA")} - R ${upper.toLocaleString("en-ZA")}`;
}

export default async function FeaturedListings() {
  const supabase = createServiceClient();

  const [
    { data: listings },
    { data: vendors },
    { data: trustRows },
    { data: reviews },
    { data: boostRows },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("id, seller_id, title, price, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase.from("seller_profiles").select("id, business_name"),
    supabase.from("vendor_trust_scores").select("vendor_id, trust_score"),
    supabase.from("reviews").select("vendor_id, rating"),
    supabase
      .from("boosts")
      .select("vendor_id, type")
      .eq("status", "active")
      .eq("type", "featured_listing")
      .gt("end_date", new Date().toISOString()),
  ]);

  const vendorNameById = new Map<string, string>(
    (vendors ?? []).map((row) => [
      String(row.id),
      String(row.business_name ?? "Vendor"),
    ]),
  );
  const trustByVendor = new Map<string, number>(
    (trustRows ?? []).map((row) => [
      String(row.vendor_id),
      Number(row.trust_score) || 0,
    ]),
  );

  const ratingsByVendor = new Map<string, number[]>();
  (reviews ?? []).forEach((row) => {
    const vendorId = String((row as { vendor_id?: string }).vendor_id ?? "");
    ratingsByVendor.set(vendorId, [
      ...(ratingsByVendor.get(vendorId) ?? []),
      Number((row as { rating?: number }).rating) || 0,
    ]);
  });

  const featuredListingSet = new Set(
    (boostRows ?? []).map((row) => String(row.vendor_id)),
  );

  const now = Date.now();
  const featured = ((listings ?? []) as ListingRow[])
    .map((listing) => {
      const ratings = ratingsByVendor.get(String(listing.seller_id)) ?? [];
      const avg = ratings.length
        ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
        : 0;
      const ageDays = Math.max(
        0,
        Math.floor(
          (now - Date.parse(String(listing.created_at))) /
            (1000 * 60 * 60 * 24),
        ),
      );
      const isRecent = ageDays <= 21;
      const isHighRated = avg >= 4.2;
      return {
        listing,
        avg,
        isRecent,
        isHighRated,
        boosted: featuredListingSet.has(String(listing.seller_id)),
      };
    })
    .filter((item) => item.isRecent || item.isHighRated)
    .sort((a, b) => Number(b.boosted) - Number(a.boosted))
    .slice(0, 9);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Featured Listings</h2>
      {featured.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No featured listings yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ listing }) => {
            const vendorId = String(listing.seller_id);
            return (
              <ListingCard
                key={listing.id}
                listingId={listing.id}
                title={listing.title}
                vendorId={vendorId}
                vendorName={vendorNameById.get(vendorId) ?? "Vendor"}
                trustBadge={badgeFor(trustByVendor.get(vendorId) ?? 0)}
                priceRange={priceRange(Number(listing.price) || 0)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
