import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = createServiceClient();

  const [
    { count: totalIntents },
    { count: totalGeneratedPages },
    { count: totalVendors },
    { count: totalListings },
    trustRes,
    freshnessRes,
  ] = await Promise.all([
    supabase.from("intent_nodes").select("id", { count: "exact", head: true }),
    supabase
      .from("generated_pages")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("seller_profiles")
      .select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("vendor_trust_scores").select("trust_score"),
    supabase.from("freshness_scores").select("score"),
  ]);

  const avgTrust = (trustRes.data ?? []).length
    ? (trustRes.data ?? []).reduce(
        (sum, row) => sum + (Number(row.trust_score) || 0),
        0,
      ) / (trustRes.data ?? []).length
    : 0;

  const avgFreshness = (freshnessRes.data ?? []).length
    ? (freshnessRes.data ?? []).reduce(
        (sum, row) => sum + (Number(row.score) || 0),
        0,
      ) / (freshnessRes.data ?? []).length
    : 0;

  const cards = [
    { label: "Total Intents", value: totalIntents ?? 0 },
    { label: "Total Generated Pages", value: totalGeneratedPages ?? 0 },
    { label: "Total Vendors", value: totalVendors ?? 0 },
    { label: "Total Listings", value: totalListings ?? 0 },
    { label: "Avg Trust Score", value: avgTrust.toFixed(1) },
    { label: "Avg Freshness Score", value: avgFreshness.toFixed(1) },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Overview</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-lh-muted text-xs tracking-wide uppercase">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
