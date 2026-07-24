import type { MetadataRoute } from "next";
import { categories, listings, suburbs } from "@/lib/mockData";
import { computeFreshnessScore } from "@/lib/seo/freshnessScore";
import { isListingExpired } from "@/lib/listings/state";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhub.co.za";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const root = siteUrl();

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${root}/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categorySuburbPages: MetadataRoute.Sitemap = categories.flatMap(
    (category) =>
      suburbs.map((suburb) => {
        const freshness = computeFreshnessScore({
          search: {
            path: `/${category.slug}/${suburb.city.toLowerCase().replace(/\s+/g, "-")}/${suburb.slug}`,
            date: now.toISOString(),
            impressions: 200,
            clicks: 20,
            ctr: 0.1,
            position: 8,
          },
        });

        return {
          url: `${root}/${category.slug}/${suburb.city.toLowerCase().replace(/\s+/g, "-")}/${suburb.slug}`,
          lastModified: now,
          changeFrequency: freshness >= 0.75 ? "daily" : "weekly",
          priority: freshness >= 0.75 ? 0.95 : 0.7,
        };
      }),
  );

  const listingPages: MetadataRoute.Sitemap = listings
    .filter((listing) => !isListingExpired(listing))
    .map((listing) => ({
      url: `${root}/listing/${listing.id}`,
      lastModified: listing.updated_at,
      changeFrequency: "daily",
      priority: 0.7,
    }));

  return [
    {
      url: root,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...categoryPages,
    ...categorySuburbPages,
    ...listingPages,
  ];
}
