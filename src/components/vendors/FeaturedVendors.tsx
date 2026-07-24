import VendorCard from "@/components/vendors/VendorCard";
import { createServiceClient } from "@/lib/db";

type VendorRow = {
  id: string;
  business_name: string;
  category_id: string | null;
};

function badgeFor(score: number): "gold" | "silver" | "bronze" | "none" {
  if (score >= 85) return "gold";
  if (score >= 70) return "silver";
  if (score >= 50) return "bronze";
  return "none";
}

export default async function FeaturedVendors() {
  const supabase = createServiceClient();

  const [
    { data: trustRows },
    { data: vendorRows },
    { data: reviewRows },
    { data: boostRows },
  ] = await Promise.all([
    supabase
      .from("vendor_trust_scores")
      .select("vendor_id, trust_score")
      .gte("trust_score", 80)
      .order("trust_score", { ascending: false })
      .limit(6),
    supabase.from("seller_profiles").select("id, business_name, category_id"),
    supabase.from("reviews").select("vendor_id, rating"),
    supabase
      .from("boosts")
      .select("vendor_id, type")
      .eq("status", "active")
      .eq("type", "featured_vendor")
      .gt("end_date", new Date().toISOString()),
  ]);

  const vendorById = new Map<string, VendorRow>(
    (vendorRows ?? []).map((row) => [String(row.id), row as VendorRow]),
  );
  const vendorIds = (trustRows ?? [])
    .map((row) => String(row.vendor_id))
    .filter((id) => vendorById.has(id));

  const categoryIds = Array.from(
    new Set(
      vendorIds.map((id) => vendorById.get(id)?.category_id).filter(Boolean),
    ),
  ) as string[];
  const { data: categories } = categoryIds.length
    ? await supabase.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const categoryNameById = new Map<string, string>(
    (categories ?? []).map((row) => [String(row.id), String(row.name)]),
  );

  const ratingsByVendor = new Map<string, number[]>();
  (reviewRows ?? []).forEach((row) => {
    const vendorId = String((row as { vendor_id?: string }).vendor_id ?? "");
    ratingsByVendor.set(vendorId, [
      ...(ratingsByVendor.get(vendorId) ?? []),
      Number((row as { rating?: number }).rating) || 0,
    ]);
  });

  const featuredSet = new Set(
    (boostRows ?? []).map((row) => String(row.vendor_id)),
  );

  const cards = vendorIds
    .map((vendorId) => ({
      vendorId,
      featured: featuredSet.has(vendorId),
    }))
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6)
    .map(({ vendorId }) => {
      const vendor = vendorById.get(vendorId)!;
      const trustScore = Number(
        (trustRows ?? []).find((row) => String(row.vendor_id) === vendorId)
          ?.trust_score ?? 0,
      );
      const ratings = ratingsByVendor.get(vendorId) ?? [];
      const averageRating = ratings.length
        ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
        : 0;
      const category = vendor.category_id
        ? (categoryNameById.get(vendor.category_id) ?? "General")
        : "General";

      return {
        vendorId,
        businessName: vendor.business_name,
        trustBadge: badgeFor(trustScore),
        averageRating,
        serviceCategories: [category],
      };
    });

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Featured Vendors</h2>
      {cards.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No featured vendors yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((vendor) => (
            <VendorCard key={vendor.vendorId} {...vendor} />
          ))}
        </div>
      )}
    </section>
  );
}
