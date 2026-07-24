import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

type FlowEventName =
  | "search_performed"
  | "intent_selected"
  | "vendor_viewed"
  | "listing_viewed";

type SearchSeed = {
  id: string;
  query: string;
  category: string;
  location: string;
  created_at: string;
};

type IntentSeed = {
  id: string;
  keyword: string;
  intent: string;
  micro_intent: string;
  created_at: string;
};

type VendorViewSeed = {
  id: string;
  vendor_id: string;
  listing_id: string;
  created_at: string;
};

type ListingViewSeed = {
  id: string;
  vendor_id: string;
  listing_id: string;
  created_at: string;
};

type BookingSeed = {
  id: string;
  seller_id: string;
  listing_id: string;
  buyer_id: string;
  status: "pending" | "confirmed";
  notes: string;
  created_at: string;
};

type SellerRow = {
  id: string;
  user_id: string;
};

type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
};

type UserRow = {
  id: string;
};

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function eventUuid(prefix: string, index: number): string {
  const base = `${prefix}${String(index + 1).padStart(10, "0")}`.slice(-12);
  return `10000000-0000-4000-8000-${base}`;
}

function bookingUuid(index: number): string {
  const suffix = String(index + 1).padStart(12, "0");
  return `50000000-0000-4000-8000-${suffix}`;
}

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

export async function seedMarketplaceFlows() {
  const supabase = createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const [{ data: sellers, error: sellersError }, { data: listings, error: listingsError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase.from("seller_profiles").select("id, user_id").limit(200),
      supabase.from("listings").select("id, seller_id, title").limit(400),
      supabase.from("users").select("id").limit(400),
    ]);

  if (sellersError) {
    throw new Error(`Failed to load seller_profiles: ${sellersError.message}`);
  }
  if (listingsError) {
    throw new Error(`Failed to load listings: ${listingsError.message}`);
  }
  if (usersError) {
    throw new Error(`Failed to load users: ${usersError.message}`);
  }

  const sellerRows = (sellers ?? []) as SellerRow[];
  const listingRows = (listings ?? []) as ListingRow[];
  const userRows = (users ?? []) as UserRow[];

  if (sellerRows.length === 0) {
    throw new Error("No seller_profiles found. Seed vendors first.");
  }
  if (listingRows.length === 0) {
    throw new Error("No listings found. Seed listings first.");
  }
  if (userRows.length === 0) {
    throw new Error("No users found. Seed users before marketplace flows.");
  }

  const now = Date.now();
  const searchQueries = [
    { query: "emergency electrician near me", category: "Electrical Services", location: "Cape Town" },
    { query: "plumber for leaking geyser", category: "Plumbing", location: "Johannesburg" },
    { query: "home deep cleaning this weekend", category: "Home Cleaning", location: "Durban" },
    { query: "landscaping and lawn maintenance", category: "Landscaping", location: "Pretoria" },
    { query: "painters for apartment repaint", category: "Painting & Renovation", location: "Gqeberha" },
    { query: "cctv installers", category: "Security Systems", location: "Bloemfontein" },
    { query: "roof leak repair urgent", category: "Roof Repair", location: "Polokwane" },
    { query: "laminate flooring installers", category: "Flooring", location: "Nelspruit" },
  ];

  const intentTemplates = [
    { keyword: "fix tripping power", intent: "book", micro_intent: "urgent_home_repair" },
    { keyword: "replace leaking geyser", intent: "compare", micro_intent: "price_and_availability" },
    { keyword: "clean house before move", intent: "book", micro_intent: "scheduled_service" },
    { keyword: "garden makeover quote", intent: "compare", micro_intent: "multi_vendor_quote" },
    { keyword: "install security cameras", intent: "book", micro_intent: "trusted_vendor_only" },
    { keyword: "repair roof before rain", intent: "book", micro_intent: "urgent_weather_related" },
  ];

  const searches: SearchSeed[] = searchQueries.map((entry, index) => ({
    id: eventUuid("210", index),
    query: entry.query,
    category: entry.category,
    location: entry.location,
    created_at: new Date(now - (index + 1) * 1000 * 60 * 23).toISOString(),
  }));

  const intents: IntentSeed[] = intentTemplates.map((entry, index) => ({
    id: eventUuid("220", index),
    keyword: entry.keyword,
    intent: entry.intent,
    micro_intent: entry.micro_intent,
    created_at: new Date(now - (index + 1) * 1000 * 60 * 19).toISOString(),
  }));

  const vendorViews: VendorViewSeed[] = Array.from({ length: 10 }).map(
    (_, index) => {
      const listing = pick(listingRows, index);
      return {
        id: eventUuid("230", index),
        vendor_id: String(listing.seller_id),
        listing_id: String(listing.id),
        created_at: new Date(now - (index + 1) * 1000 * 60 * 13).toISOString(),
      };
    },
  );

  const listingViews: ListingViewSeed[] = Array.from({ length: 12 }).map(
    (_, index) => {
      const listing = pick(listingRows, index + 3);
      return {
        id: eventUuid("240", index),
        vendor_id: String(listing.seller_id),
        listing_id: String(listing.id),
        created_at: new Date(now - (index + 1) * 1000 * 60 * 11).toISOString(),
      };
    },
  );

  const bookingSeeds: BookingSeed[] = Array.from({ length: 10 }).map((_, index) => {
    const listing = pick(listingRows, index + 5);
    const user = pick(userRows, index + 2);
    return {
      id: bookingUuid(index),
      seller_id: String(listing.seller_id),
      listing_id: String(listing.id),
      buyer_id: String(user.id),
      status: index % 2 === 0 ? "pending" : "confirmed",
      notes:
        index % 2 === 0
          ? "Customer requested a standard booking window."
          : "Customer confirmed availability and asked for follow-up.",
      created_at: new Date(now - (index + 1) * 1000 * 60 * 47).toISOString(),
    };
  });

  const analyticsRows = [
    ...searches.map((item) => ({
      id: item.id,
      event_name: "search_performed" as FlowEventName,
      payload: {
        query: item.query,
        category: item.category,
        location: item.location,
      },
      created_at: item.created_at,
    })),
    ...intents.map((item) => ({
      id: item.id,
      event_name: "intent_selected" as FlowEventName,
      payload: {
        keyword: item.keyword,
        intent: item.intent,
        micro_intent: item.micro_intent,
      },
      created_at: item.created_at,
    })),
    ...vendorViews.map((item) => ({
      id: item.id,
      event_name: "vendor_viewed" as FlowEventName,
      payload: {
        vendor_id: item.vendor_id,
        listing_id: item.listing_id,
      },
      created_at: item.created_at,
    })),
    ...listingViews.map((item) => ({
      id: item.id,
      event_name: "listing_viewed" as FlowEventName,
      payload: {
        vendor_id: item.vendor_id,
        listing_id: item.listing_id,
      },
      created_at: item.created_at,
    })),
  ];

  const { data: seededEvents, error: eventsError } = await supabase
    .from("analytics_events")
    .upsert(analyticsRows, { onConflict: "id", ignoreDuplicates: false })
    .select("id, event_name, created_at");

  if (eventsError) {
    throw new Error(`Failed to seed analytics_events: ${eventsError.message}`);
  }

  const bookingRows = bookingSeeds.map((item) => ({
    id: item.id,
    seller_id: item.seller_id,
    buyer_id: item.buyer_id,
    listing_id: item.listing_id,
    status: item.status,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.created_at,
  }));

  const { data: seededBookings, error: bookingsError } = await supabase
    .from("bookings")
    .upsert(bookingRows, { onConflict: "id", ignoreDuplicates: false })
    .select("id, seller_id, listing_id, buyer_id, status, notes, created_at");

  if (bookingsError) {
    throw new Error(`Failed to seed bookings: ${bookingsError.message}`);
  }

  console.log(
    `Seeded/updated ${seededEvents?.length ?? 0} flow events and ${seededBookings?.length ?? 0} bookings.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedMarketplaceFlows()
    .then(() => {
      console.log("Marketplace flows seed completed.");
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Marketplace flows seed failed: ${message}`);
      process.exit(1);
    });
}