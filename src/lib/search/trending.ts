import { createServiceClient } from "@/lib/db";
import { getRecentSearches } from "@/lib/search/logSearch";

export type TrendingKeyword = { keyword: string; score: number };

function addScore(map: Map<string, number>, keyword: string, value: number) {
  const normalized = String(keyword ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) ?? 0) + value);
}

export async function computeTrendingKeywords(
  limit = 20,
): Promise<TrendingKeyword[]> {
  const supabase = createServiceClient();
  const scores = new Map<string, number>();

  const { data: intents } = await supabase
    .from("intent_nodes")
    .select("keyword, search_count, score")
    .order("search_count", { ascending: false })
    .limit(200);

  (intents ?? []).forEach((item) => {
    const count = Number(item.search_count ?? 0);
    const baseScore = Number(item.score ?? 0);
    addScore(scores, String(item.keyword ?? ""), count * 2 + baseScore * 10);
  });

  getRecentSearches().forEach((entry) => {
    addScore(scores, entry.keyword, 8);
  });

  const [
    { data: bookings },
    { data: reviews },
    { data: vendors },
    { data: categories },
  ] = await Promise.all([
    supabase.from("bookings").select("vendor_id").limit(2000),
    supabase.from("reviews").select("vendor_id").limit(2000),
    supabase.from("seller_profiles").select("id, category_id"),
    supabase.from("categories").select("id, slug, name"),
  ]);

  const categoryById = new Map<string, string>(
    (categories ?? []).map((category) => [
      String(category.id),
      String(category.slug ?? category.name),
    ]),
  );
  const categoryByVendorId = new Map<string, string>();
  (vendors ?? []).forEach((vendor) => {
    const categoryKeyword = categoryById.get(String(vendor.category_id ?? ""));
    if (categoryKeyword) {
      categoryByVendorId.set(String(vendor.id), categoryKeyword);
    }
  });

  (bookings ?? []).forEach((booking) => {
    const keyword = categoryByVendorId.get(String(booking.vendor_id ?? ""));
    if (keyword) addScore(scores, keyword, 3);
  });

  (reviews ?? []).forEach((review) => {
    const keyword = categoryByVendorId.get(String(review.vendor_id ?? ""));
    if (keyword) addScore(scores, keyword, 2);
  });

  return Array.from(scores.entries())
    .map(([keyword, score]) => ({ keyword, score: Math.round(score) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
