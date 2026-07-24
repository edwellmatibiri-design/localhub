import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { seedCategories } from "./seedCategories";

type ListingSeed = {
  id: string;
  vendor_id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  thumbnail_url: string;
  availability: "available_now" | "limited" | "booked_this_week";
  created_at: string;
};

type ListingTemplate = Omit<ListingSeed, "vendor_id">;

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function listingUuid(index: number): string {
  const suffix = String(index + 1).padStart(12, "0");
  return `00000000-0000-4000-8000-${suffix}`;
}

const now = Date.now();

const listingTemplates: ListingTemplate[] = [
  {
    id: listingUuid(0),
    title: "Emergency Electrician Callout",
    price: 850,
    description:
      "Certified electrician for urgent faults, tripping circuits, and DB board checks. Includes basic safety inspection.",
    category: "Electrical Services",
    thumbnail_url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=80",
    availability: "available_now",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    id: listingUuid(1),
    title: "Geyser Repair and Replacement",
    price: 1450,
    description:
      "Plumbing service for leaking or no-hot-water geysers. Fast diagnosis and replacement with compliant fittings.",
    category: "Plumbing",
    thumbnail_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80",
    availability: "limited",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 17).toISOString(),
  },
  {
    id: listingUuid(2),
    title: "Deep Home Cleaning Package",
    price: 1200,
    description:
      "Top-to-bottom home deep clean for kitchens, bathrooms, and high-touch surfaces. Eco-safe products included.",
    category: "Home Cleaning",
    thumbnail_url: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200&q=80",
    availability: "available_now",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 16).toISOString(),
  },
  {
    id: listingUuid(3),
    title: "Garden Makeover and Maintenance",
    price: 1850,
    description:
      "Lawn restoration, hedge trimming, and planting plans tailored to local climate and water usage goals.",
    category: "Landscaping",
    thumbnail_url: "https://images.unsplash.com/photo-1598902108854-10e335adac99?w=1200&q=80",
    availability: "booked_this_week",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: listingUuid(4),
    title: "Interior Paint Refresh (2 Rooms)",
    price: 2600,
    description:
      "Professional prep, crack filling, and two-coat finish for bedrooms, lounges, and home offices.",
    category: "Painting & Renovation",
    thumbnail_url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80",
    availability: "limited",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: listingUuid(5),
    title: "CCTV and Alarm Installation",
    price: 4300,
    description:
      "Supply and install smart CCTV and alarm systems with mobile monitoring setup and handover training.",
    category: "Security Systems",
    thumbnail_url: "https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80",
    availability: "available_now",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 13).toISOString(),
  },
  {
    id: listingUuid(6),
    title: "Roof Leak Detection and Repair",
    price: 2950,
    description:
      "Waterproofing and leak repair for tiled and corrugated roofs before seasonal rains.",
    category: "Roof Repair",
    thumbnail_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
    availability: "booked_this_week",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: listingUuid(7),
    title: "Laminate Flooring Installation",
    price: 3400,
    description:
      "Accurate room measurement, underlay prep, and clean-edge laminate floor installation.",
    category: "Flooring",
    thumbnail_url: "https://images.unsplash.com/photo-1616594039964-3f90df9583fe?w=1200&q=80",
    availability: "limited",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 11).toISOString(),
  },
  {
    id: listingUuid(8),
    title: "Home HVAC Service and Tune-Up",
    price: 1750,
    description:
      "AC cleaning, gas pressure checks, and airflow balancing for better cooling and lower energy costs.",
    category: "HVAC",
    thumbnail_url: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1200&q=80",
    availability: "available_now",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: listingUuid(9),
    title: "Kitchen Remodel Starter Package",
    price: 12500,
    description:
      "Cabinet refresh, countertop replacement planning, and labor coordination for compact kitchen upgrades.",
    category: "General Contracting",
    thumbnail_url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&q=80",
    availability: "booked_this_week",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: listingUuid(10),
    title: "Outdoor Lighting Design + Install",
    price: 2200,
    description:
      "Pathway and security lighting plans with weatherproof fittings and neat cable management.",
    category: "Electrical Services",
    thumbnail_url: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1200&q=80",
    availability: "limited",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: listingUuid(11),
    title: "Blocked Drain Jetting Service",
    price: 990,
    description:
      "High-pressure drain clearing for kitchens, showers, and main lines with post-service camera check.",
    category: "Plumbing",
    thumbnail_url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80",
    availability: "available_now",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: listingUuid(12),
    title: "Move-In Sanitization Clean",
    price: 1400,
    description:
      "Detailed move-in clean including cabinets, appliances, windowsills, and disinfection for occupied homes.",
    category: "Home Cleaning",
    thumbnail_url: "https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?w=1200&q=80",
    availability: "limited",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: listingUuid(13),
    title: "Irrigation Setup for Small Gardens",
    price: 1950,
    description:
      "Drip and sprinkler installation for low-maintenance watering schedules and healthier lawns.",
    category: "Landscaping",
    thumbnail_url: "https://images.unsplash.com/photo-1463123081488-789f998ac9c4?w=1200&q=80",
    availability: "available_now",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: listingUuid(14),
    title: "Exterior Wall Repaint + Seal",
    price: 5800,
    description:
      "Exterior painting with weather-resistant coatings and crack sealing for long-term durability.",
    category: "Painting & Renovation",
    thumbnail_url: "https://images.unsplash.com/photo-1429661666991-14d8d5f9f34f?w=1200&q=80",
    availability: "booked_this_week",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: listingUuid(15),
    title: "Electric Fence Maintenance",
    price: 1650,
    description:
      "Fence line testing, energizer diagnostics, and compliance checks for perimeter security systems.",
    category: "Security Systems",
    thumbnail_url: "https://images.unsplash.com/photo-1581091870622-2b523f6f0c7a?w=1200&q=80",
    availability: "limited",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: listingUuid(16),
    title: "Ceiling Repair and Repaint",
    price: 2400,
    description:
      "Fix water-damaged ceilings, replace affected sections, and repaint for a clean finish.",
    category: "Roof Repair",
    thumbnail_url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80",
    availability: "available_now",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: listingUuid(17),
    title: "Vinyl Floor Upgrade",
    price: 3100,
    description:
      "Water-resistant vinyl plank installation for kitchens and high-traffic rooms.",
    category: "Flooring",
    thumbnail_url: "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=1200&q=80",
    availability: "limited",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: listingUuid(18),
    title: "Split Unit AC Installation",
    price: 4800,
    description:
      "Install and commission inverter split AC units with electrical checks and customer walkthrough.",
    category: "HVAC",
    thumbnail_url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&q=80",
    availability: "booked_this_week",
    created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: listingUuid(19),
    title: "Bathroom Renovation Essentials",
    price: 9800,
    description:
      "Tile replacement, fixture updates, and waterproofing prep for medium-sized bathroom remodels.",
    category: "General Contracting",
    thumbnail_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
    availability: "available_now",
    created_at: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
  },
];

function toStatus(availability: ListingSeed["availability"]): "approved" | "pending_review" {
  return availability === "booked_this_week" ? "pending_review" : "approved";
}

function toIsActive(availability: ListingSeed["availability"]): boolean {
  return availability !== "booked_this_week";
}

function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase();
}

async function loadCategories(
  supabase: ReturnType<typeof createClient>,
): Promise<Array<{ id: string; name: string; slug: string }>> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .limit(1000);

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id ?? "").trim(),
    name: String(row.name ?? "").trim(),
    slug: String(row.slug ?? "").trim(),
  }));
}

function findMissingCategoryNames(
  categories: Array<{ id: string; name: string; slug: string }>,
  requiredCategoryNames: string[],
): string[] {
  const existing = new Set(categories.map((row) => normalizeCategoryKey(row.name)));
  return requiredCategoryNames.filter((name) => !existing.has(normalizeCategoryKey(name)));
}

async function ensureRequiredCategories(
  supabase: ReturnType<typeof createClient>,
  requiredCategoryNames: string[],
): Promise<Array<{ id: string; name: string; slug: string }>> {
  let categories = await loadCategories(supabase);
  let missing = findMissingCategoryNames(categories, requiredCategoryNames);

  if (missing.length > 0) {
    await seedCategories();
    categories = await loadCategories(supabase);
    missing = findMissingCategoryNames(categories, requiredCategoryNames);
  }

  if (missing.length > 0) {
    throw new Error(`Missing categories for listing seed: ${missing.join(", ")}`);
  }

  return categories;
}

export async function seedListings() {
  const supabase = createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const requiredCategoryNames = Array.from(
    new Set(listingTemplates.map((listing) => listing.category)),
  );
  const categories = await ensureRequiredCategories(supabase, requiredCategoryNames);

  const categoryIdByKey = new Map<string, string>();
  categories.forEach((row) => {
    const id = row.id;
    const nameKey = normalizeCategoryKey(row.name);
    const slugKey = normalizeCategoryKey(row.slug);

    if (!id) {
      return;
    }
    if (nameKey) {
      categoryIdByKey.set(nameKey, id);
    }
    if (slugKey) {
      categoryIdByKey.set(slugKey, id);
    }
  });

  const { data: sellers, error: sellersError } = await supabase
    .from("seller_profiles")
    .select("id")
    .limit(100);

  if (sellersError) {
    throw new Error(`Failed to load seller profiles: ${sellersError.message}`);
  }

  const sellerIds = (sellers ?? [])
    .map((row) => String(row.id ?? "").trim())
    .filter(Boolean);

  if (sellerIds.length === 0) {
    throw new Error(
      "No seller_profiles records found. Seed or create seller profiles before seeding listings.",
    );
  }

  const seededListings: ListingSeed[] = listingTemplates.map((listing, index) => ({
    ...listing,
    vendor_id: sellerIds[index % sellerIds.length],
  }));

  const missingCategories = Array.from(
    new Set(
      seededListings
        .map((listing) => listing.category)
        .filter((category) => !categoryIdByKey.has(normalizeCategoryKey(category))),
    ),
  );

  if (missingCategories.length > 0) {
    throw new Error(
      `Missing categories for listing seed: ${missingCategories.join(", ")}`,
    );
  }

  const upsertRows = seededListings.map((listing) => ({
    id: listing.id,
    seller_id: listing.vendor_id,
    category_id: categoryIdByKey.get(normalizeCategoryKey(listing.category)) ?? null,
    title: listing.title,
    price: listing.price,
    description: listing.description,
    images: [listing.thumbnail_url],
    status: toStatus(listing.availability),
    is_active: toIsActive(listing.availability),
    created_at: listing.created_at,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("listings")
    .upsert(upsertRows, { onConflict: "id", ignoreDuplicates: false })
    .select("id, seller_id, title, price, description, status, created_at");

  if (error) {
    throw new Error(`Failed to seed listings: ${error.message}`);
  }

  console.log(`Seeded/updated ${data?.length ?? 0} listings.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedListings()
    .then(() => {
      console.log("Listings seed completed.");
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Listings seed failed: ${message}`);
      process.exit(1);
    });
}