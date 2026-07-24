import type { Metadata } from "next";
import Link from "next/link";
import SearchBar from "@/components/search/SearchBar";
import TrendingSearches from "@/components/search/TrendingSearches";
import FeaturedVendors from "@/components/vendors/FeaturedVendors";
import FeaturedListings from "@/components/listings/FeaturedListings";
import { createServiceClient } from "@/lib/db";
import {
  recordAdImpression,
  selectHomepageBanners,
} from "@/lib/ads/biddingEngine";

export const metadata: Metadata = {
  title: "LocalHub Marketplace",
  description:
    "LocalHub Marketplace — discover trusted local vendors and services.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServiceClient();

  const [
    { data: categories },
    { data: suburbs },
    { data: intents },
    { data: guides },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("name, slug")
      .order("name", { ascending: true })
      .limit(8),
    supabase
      .from("suburbs")
      .select("name, slug, city")
      .order("name", { ascending: true })
      .limit(8),
    supabase
      .from("intent_nodes")
      .select("keyword, score")
      .order("score", { ascending: false })
      .limit(8),
    supabase
      .from("content_guides")
      .select("id, title, slug, location, updated_at")
      .order("updated_at", { ascending: false })
      .limit(24),
  ]);
  const popularNearYouToken = String(suburbs?.[0]?.slug ?? "");

  const homepageBanners = await selectHomepageBanners(2);
  await Promise.all(
    homepageBanners.map((ad) => recordAdImpression(Number(ad.id))),
  );
  const bannerVendorIds = Array.from(
    new Set(homepageBanners.map((ad) => String(ad.vendor_id))),
  );
  const { data: bannerVendors } = bannerVendorIds.length
    ? await supabase
        .from("seller_profiles")
        .select("id, business_name")
        .in("id", bannerVendorIds)
    : { data: [] as Array<{ id: string; business_name: string }> };
  const bannerVendorNameById = new Map<string, string>(
    (bannerVendors ?? []).map((row) => [
      String(row.id),
      String(row.business_name),
    ]),
  );

  const popularGuides = (guides ?? []).slice(0, 6);
  const newGuides = [...(guides ?? [])]
    .sort(
      (a, b) =>
        Date.parse(String(b.updated_at)) - Date.parse(String(a.updated_at)),
    )
    .slice(0, 6);
  const nearGuides = (guides ?? [])
    .filter(
      (guide) =>
        String(guide.location ?? "").toLowerCase() ===
        popularNearYouToken.toLowerCase(),
    )
    .slice(0, 6);

  return (
    <section className="shell space-y-6 p-6">
      <section className="card from-lh-accent/10 text-lh-on-accent to-lh-emerald/10 space-y-4 bg-gradient-to-br">
        <p className="badge bg-lh-emerald/15 text-lh-emerald">
          Find Trusted Local Services
        </p>
        <h1 className="text-4xl font-bold">LocalHub Marketplace</h1>
        <p className="text-lh-text-secondary text-lg">
          Your trusted marketplace for local vendors, services, and bookings.
        </p>
        <SearchBar />
      </section>

      {homepageBanners.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Sponsored Banner</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {homepageBanners.map((ad) => (
              <Link
                key={ad.id}
                href={`/vendors/${ad.vendor_id}`}
                className="card border-lh-accent hover:border-lh-accent/60 border-l-4"
              >
                <p className="badge bg-lh-warning/20 text-lh-warning">
                  Sponsored
                </p>
                <p className="mt-2 font-semibold">
                  {bannerVendorNameById.get(String(ad.vendor_id)) ?? "Vendor"}
                </p>
                <p className="text-lh-muted text-sm">
                  Featured homepage banner
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured Categories</h2>
          <Link
            href="/categories"
            className="text-lh-accent text-sm font-medium hover:underline"
          >
            View all categories
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {(categories ?? []).map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{category.name}</p>
              <p className="text-lh-muted mt-1 text-xs">
                Explore providers and listings
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured Locations</h2>
          <Link
            href="/locations"
            className="text-lh-accent text-sm font-medium hover:underline"
          >
            View all locations
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {(suburbs ?? []).map((suburb) => (
            <Link
              key={suburb.slug}
              href={`/locations/${suburb.slug}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{suburb.name}</p>
              <p className="text-lh-muted mt-1 text-xs">{suburb.city}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Trending Searches</h2>
          <Link
            href="/trending"
            className="text-lh-accent text-sm font-medium hover:underline"
          >
            See all trending
          </Link>
        </div>
        <TrendingSearches />
      </section>

      <TrendingSearches
        title="Popular Near You"
        filterContains={
          popularNearYouToken || String(intents?.[0]?.keyword ?? "")
        }
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Popular Guides</h2>
          <Link
            href="/guides"
            className="text-lh-accent text-sm font-medium hover:underline"
          >
            Browse all guides
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {popularGuides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{guide.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">New Guides</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {newGuides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{guide.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Guides Near You</h2>
        {nearGuides.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No local guides yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {nearGuides.map((guide) => (
              <Link
                key={guide.id}
                href={`/guides/${guide.slug}`}
                className="card hover:border-lh-accent/40"
              >
                <p className="font-medium">{guide.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <FeaturedVendors />
      <FeaturedListings />
    </section>
  );
}
