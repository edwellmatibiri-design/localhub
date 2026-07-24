import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

type CrawlerEventName =
  | "crawl_started"
  | "crawl_completed"
  | "crawl_failed"
  | "page_generated"
  | "freshness_scored";

type SellerRow = {
  id: string;
};

type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
};

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function eventUuid(index: number): string {
  const suffix = String(index + 1).padStart(12, "0");
  return `30000000-0000-4000-8000-${suffix}`;
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function seedCrawlerDemo() {
  const supabase = createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const [{ data: sellers, error: sellersError }, { data: listings, error: listingsError }] =
    await Promise.all([
      supabase.from("seller_profiles").select("id").limit(200),
      supabase.from("listings").select("id, seller_id, title").limit(400),
    ]);

  if (sellersError) {
    throw new Error(`Failed to load seller_profiles: ${sellersError.message}`);
  }
  if (listingsError) {
    throw new Error(`Failed to load listings: ${listingsError.message}`);
  }

  const sellerRows = (sellers ?? []) as SellerRow[];
  const listingRows = (listings ?? []) as ListingRow[];

  if (sellerRows.length === 0) {
    throw new Error("No sellers found. Seed vendors before crawler demo data.");
  }
  if (listingRows.length === 0) {
    throw new Error("No listings found. Seed listings before crawler demo data.");
  }

  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const rows: Array<{
    id: string;
    event_name: CrawlerEventName;
    payload: Record<string, unknown>;
    created_at: string;
  }> = [];

  let cursor = 0;

  // 30-day spread of crawl starts/completions with occasional failures and page generation.
  for (let day = 0; day < 30; day += 1) {
    const listing = pick(listingRows, day);
    const seller = pick(sellerRows, day);
    const baseTime = now - day * dayMs;
    const pagePath = `/listings/${listing.id}`;

    rows.push({
      id: eventUuid(cursor++),
      event_name: "crawl_started",
      payload: {
        vendor_id: seller.id,
        listing_id: listing.id,
        page_path: pagePath,
        source: "crawler_demo_seed",
        queue: day % 2 === 0 ? "priority" : "standard",
      },
      created_at: new Date(baseTime - 1000 * 60 * 40).toISOString(),
    });

    const failed = day % 7 === 0;
    if (failed) {
      rows.push({
        id: eventUuid(cursor++),
        event_name: "crawl_failed",
        payload: {
          vendor_id: seller.id,
          listing_id: listing.id,
          page_path: pagePath,
          reason: day % 14 === 0 ? "timeout" : "temporary_5xx",
          retry_scheduled: true,
        },
        created_at: new Date(baseTime - 1000 * 60 * 28).toISOString(),
      });
    } else {
      rows.push({
        id: eventUuid(cursor++),
        event_name: "crawl_completed",
        payload: {
          vendor_id: seller.id,
          listing_id: listing.id,
          page_path: pagePath,
          duration_ms: 800 + day * 17,
          status_code: 200,
        },
        created_at: new Date(baseTime - 1000 * 60 * 28).toISOString(),
      });
    }

    if (day % 3 === 0) {
      rows.push({
        id: eventUuid(cursor++),
        event_name: "page_generated",
        payload: {
          vendor_id: seller.id,
          listing_id: listing.id,
          page_path: pagePath,
          title: listing.title,
          generation_type: day % 2 === 0 ? "refresh" : "new_variant",
        },
        created_at: new Date(baseTime - 1000 * 60 * 18).toISOString(),
      });
    }

    const freshness = clamp(92 - day * 2 + (day % 5), 18, 97);
    rows.push({
      id: eventUuid(cursor++),
      event_name: "freshness_scored",
      payload: {
        vendor_id: seller.id,
        listing_id: listing.id,
        page_path: pagePath,
        score: freshness,
        impressions: 150 + day * 12,
        clicks: 20 + day * 3,
        ctr: Number(((20 + day * 3) / (150 + day * 12)).toFixed(4)),
      },
      created_at: new Date(baseTime - 1000 * 60 * 10).toISOString(),
    });
  }

  const { data, error } = await supabase
    .from("analytics_events")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: false })
    .select("id, event_name, created_at");

  if (error) {
    throw new Error(`Failed to seed crawler demo events: ${error.message}`);
  }

  console.log(`Seeded/updated ${data?.length ?? 0} crawler demo events.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedCrawlerDemo()
    .then(() => {
      console.log("Crawler demo seed completed.");
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Crawler demo seed failed: ${message}`);
      process.exit(1);
    });
}