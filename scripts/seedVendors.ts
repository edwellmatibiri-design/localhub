import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { seedCategories } from "./seedCategories";

type SeedVendor = {
  id: string;
  name: string;
  category: string;
  location: string;
  verified: boolean;
  flagged: boolean;
  risk_score: number;
  created_at: string;
};

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const now = new Date();

const vendorSeeds: SeedVendor[] = [
  {
    id: "vendor-apex-electric-001",
    name: "Apex Electrical Co.",
    category: "Electrical Services",
    location: "Cape Town, Western Cape",
    verified: true,
    flagged: false,
    risk_score: 12,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: "vendor-swiftfix-plumbing-002",
    name: "SwiftFix Plumbing",
    category: "Plumbing",
    location: "Johannesburg, Gauteng",
    verified: true,
    flagged: false,
    risk_score: 18,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    id: "vendor-brightnest-cleaners-003",
    name: "BrightNest Cleaners",
    category: "Home Cleaning",
    location: "Durban, KwaZulu-Natal",
    verified: true,
    flagged: false,
    risk_score: 22,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 17).toISOString(),
  },
  {
    id: "vendor-greenline-gardens-004",
    name: "GreenLine Garden Pros",
    category: "Landscaping",
    location: "Pretoria, Gauteng",
    verified: false,
    flagged: false,
    risk_score: 34,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: "vendor-prime-painters-005",
    name: "Prime Painters Studio",
    category: "Painting & Renovation",
    location: "Gqeberha, Eastern Cape",
    verified: true,
    flagged: false,
    risk_score: 20,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: "vendor-securehome-installers-006",
    name: "SecureHome Installers",
    category: "Security Systems",
    location: "Bloemfontein, Free State",
    verified: true,
    flagged: false,
    risk_score: 27,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 11).toISOString(),
  },
  {
    id: "vendor-sunpeak-roofing-007",
    name: "SunPeak Roofing",
    category: "Roof Repair",
    location: "Polokwane, Limpopo",
    verified: false,
    flagged: true,
    risk_score: 73,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: "vendor-lumina-tiling-008",
    name: "Lumina Tiling & Floors",
    category: "Flooring",
    location: "Nelspruit, Mpumalanga",
    verified: true,
    flagged: false,
    risk_score: 25,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: "vendor-harbor-hvac-009",
    name: "Harbor HVAC Solutions",
    category: "HVAC",
    location: "East London, Eastern Cape",
    verified: false,
    flagged: false,
    risk_score: 41,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "vendor-blueoak-builders-010",
    name: "BlueOak Builders",
    category: "General Contracting",
    location: "Kimberley, Northern Cape",
    verified: true,
    flagged: false,
    risk_score: 16,
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
];

function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase();
}

async function loadCategories(
  supabase: ReturnType<typeof createClient>,
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .limit(1000);

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id ?? "").trim(),
    name: String(row.name ?? "").trim(),
  }));
}

function findMissingCategoryNames(
  categories: Array<{ id: string; name: string }>,
  requiredCategoryNames: string[],
): string[] {
  const existing = new Set(categories.map((row) => normalizeCategoryKey(row.name)));
  return requiredCategoryNames.filter((name) => !existing.has(normalizeCategoryKey(name)));
}

async function ensureRequiredCategories(
  supabase: ReturnType<typeof createClient>,
  requiredCategoryNames: string[],
): Promise<Array<{ id: string; name: string }>> {
  let categories = await loadCategories(supabase);
  let missing = findMissingCategoryNames(categories, requiredCategoryNames);

  if (missing.length > 0) {
    await seedCategories();
    categories = await loadCategories(supabase);
    missing = findMissingCategoryNames(categories, requiredCategoryNames);
  }

  if (missing.length > 0) {
    throw new Error(`Missing categories for vendor seed: ${missing.join(", ")}`);
  }

  return categories;
}

export async function seedVendors() {
  const supabase = createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const requiredCategoryNames = Array.from(
    new Set(vendorSeeds.map((vendor) => vendor.category)),
  );
  const categories = await ensureRequiredCategories(supabase, requiredCategoryNames);

  const categoryIdByName = new Map<string, string>(
    categories.map((row) => [normalizeCategoryKey(row.name), row.id]),
  );

  const missingCategories = Array.from(
    new Set(
      vendorSeeds
        .map((vendor) => vendor.category)
        .filter((name) => !categoryIdByName.has(normalizeCategoryKey(name))),
    ),
  );

  if (missingCategories.length > 0) {
    throw new Error(
      `Missing categories for vendor seed: ${missingCategories.join(", ")}`,
    );
  }

  const upsertRows = vendorSeeds.map((vendor) => ({
    id: vendor.id,
    display_name: vendor.name,
    business_name: vendor.name,
    category_id: categoryIdByName.get(normalizeCategoryKey(vendor.category)) ?? null,
    location: vendor.location,
    verified: vendor.verified,
    flagged: vendor.flagged,
    risk_score: Math.max(0, Math.min(100, vendor.risk_score)),
    created_at: vendor.created_at,
  }));

  const { data, error } = await supabase
    .from("vendor_profiles")
    .upsert(upsertRows, { onConflict: "id", ignoreDuplicates: false })
    .select("id, display_name, category_id, location, verified, flagged, risk_score, created_at");

  if (error) {
    throw new Error(`Failed to seed vendor_profiles: ${error.message}`);
  }

  console.log(`Seeded/updated ${data?.length ?? 0} vendors.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedVendors()
    .then(() => {
      console.log("Vendor seed completed.");
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Vendor seed failed: ${message}`);
      process.exit(1);
    });
}