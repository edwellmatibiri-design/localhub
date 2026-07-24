import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { seedCategories } from "./seedCategories";

type SellerSeed = {
  seller_id: string;
  user_id: string;
  email: string;
  full_name: string;
  business_name: string;
  category: string;
  description: string;
  created_at: string;
};

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function userUuid(index: number): string {
  const suffix = String(index + 1).padStart(12, "0");
  return `20000000-0000-4000-8000-${suffix}`;
}

function sellerUuid(index: number): string {
  const suffix = String(index + 1).padStart(12, "0");
  return `40000000-0000-4000-8000-${suffix}`;
}

function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase();
}

const now = Date.now();

const sellerSeeds: SellerSeed[] = [
  {
    seller_id: sellerUuid(0),
    user_id: userUuid(0),
    email: "apex.electrical@localhub.demo",
    full_name: "Alex Mbeki",
    business_name: "Apex Electrical Co.",
    category: "Electrical Services",
    description: "Certified residential and light-commercial electrical services.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    seller_id: sellerUuid(1),
    user_id: userUuid(1),
    email: "swiftfix.plumbing@localhub.demo",
    full_name: "Thabo Naidoo",
    business_name: "SwiftFix Plumbing",
    category: "Plumbing",
    description: "Rapid-response plumbing specialists for repairs and maintenance.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 19).toISOString(),
  },
  {
    seller_id: sellerUuid(2),
    user_id: userUuid(2),
    email: "brightnest.clean@localhub.demo",
    full_name: "Nandi Dlamini",
    business_name: "BrightNest Cleaners",
    category: "Home Cleaning",
    description: "Professional deep-clean and recurring home cleaning services.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    seller_id: sellerUuid(3),
    user_id: userUuid(3),
    email: "greenline.gardens@localhub.demo",
    full_name: "Pieter van Wyk",
    business_name: "GreenLine Garden Pros",
    category: "Landscaping",
    description: "Landscaping, irrigation, and lawn maintenance tailored to local climates.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 17).toISOString(),
  },
  {
    seller_id: sellerUuid(4),
    user_id: userUuid(4),
    email: "prime.painters@localhub.demo",
    full_name: "Lebo Nkosi",
    business_name: "Prime Painters Studio",
    category: "Painting & Renovation",
    description: "Interior and exterior painting with renovation finishing services.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 16).toISOString(),
  },
  {
    seller_id: sellerUuid(5),
    user_id: userUuid(5),
    email: "securehome.installers@localhub.demo",
    full_name: "Sibusiso Khumalo",
    business_name: "SecureHome Installers",
    category: "Security Systems",
    description: "CCTV, alarm, and perimeter security installation and servicing.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    seller_id: sellerUuid(6),
    user_id: userUuid(6),
    email: "sunpeak.roofing@localhub.demo",
    full_name: "Johan Pretorius",
    business_name: "SunPeak Roofing",
    category: "Roof Repair",
    description: "Leak detection, waterproofing, and roof restoration specialists.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    seller_id: sellerUuid(7),
    user_id: userUuid(7),
    email: "lumina.floors@localhub.demo",
    full_name: "Ayesha Patel",
    business_name: "Lumina Tiling & Floors",
    category: "Flooring",
    description: "Laminate, vinyl, and tile flooring installation and repairs.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 13).toISOString(),
  },
  {
    seller_id: sellerUuid(8),
    user_id: userUuid(8),
    email: "harbor.hvac@localhub.demo",
    full_name: "Mpho Molefe",
    business_name: "Harbor HVAC Solutions",
    category: "HVAC",
    description: "Air conditioning install, maintenance, and performance tuning.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    seller_id: sellerUuid(9),
    user_id: userUuid(9),
    email: "blueoak.builders@localhub.demo",
    full_name: "Grace Maseko",
    business_name: "BlueOak Builders",
    category: "General Contracting",
    description: "End-to-end renovation and general contracting for homes.",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 11).toISOString(),
  },
];

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
    throw new Error(`Missing categories for seller seed: ${missing.join(", ")}`);
  }

  return categories;
}

export async function seedSellers() {
  const supabase = createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const requiredCategoryNames = Array.from(
    new Set(sellerSeeds.map((seller) => seller.category)),
  );
  const categories = await ensureRequiredCategories(supabase, requiredCategoryNames);

  const categoryIdByName = new Map<string, string>(
    categories.map((row) => [normalizeCategoryKey(row.name), row.id]),
  );

  const { data: existingUsers, error: existingUsersError } = await supabase
    .from("users")
    .select("id, email")
    .in(
      "email",
      sellerSeeds.map((seller) => seller.email),
    );

  if (existingUsersError) {
    throw new Error(`Failed to load users: ${existingUsersError.message}`);
  }

  const existingUserIdByEmail = new Map<string, string>(
    (existingUsers ?? []).map((row) => [
      String(row.email ?? "").trim().toLowerCase(),
      String(row.id ?? "").trim(),
    ]),
  );

  const missingUserRows = sellerSeeds
    .filter((seller) => !existingUserIdByEmail.has(seller.email.trim().toLowerCase()))
    .map((seller) => ({
      id: seller.user_id,
      email: seller.email,
      full_name: seller.full_name,
      role: "seller",
      created_at: seller.created_at,
    }));

  if (missingUserRows.length > 0) {
    const { error: insertUsersError } = await supabase
      .from("users")
      .upsert(missingUserRows, { onConflict: "id", ignoreDuplicates: false });

    if (insertUsersError) {
      throw new Error(`Failed to seed users: ${insertUsersError.message}`);
    }
  }

  const { data: allUsers, error: allUsersError } = await supabase
    .from("users")
    .select("id, email")
    .in(
      "email",
      sellerSeeds.map((seller) => seller.email),
    );

  if (allUsersError) {
    throw new Error(`Failed to reload users: ${allUsersError.message}`);
  }

  const userIdByEmail = new Map<string, string>(
    (allUsers ?? []).map((row) => [
      String(row.email ?? "").trim().toLowerCase(),
      String(row.id ?? "").trim(),
    ]),
  );

  const missingUsers = sellerSeeds
    .map((seller) => seller.email)
    .filter((email) => !userIdByEmail.has(email.trim().toLowerCase()));

  if (missingUsers.length > 0) {
    throw new Error(`Missing users for seller seed: ${missingUsers.join(", ")}`);
  }

  const upsertRows = sellerSeeds.map((seller) => ({
    id: seller.seller_id,
    user_id: userIdByEmail.get(seller.email.trim().toLowerCase()) ?? null,
    business_name: seller.business_name,
    category_id: categoryIdByName.get(normalizeCategoryKey(seller.category)) ?? null,
    description: seller.description,
    contact_email: seller.email,
    created_at: seller.created_at,
  }));

  const { data, error } = await supabase
    .from("seller_profiles")
    .upsert(upsertRows, { onConflict: "id", ignoreDuplicates: false })
    .select("id, user_id, business_name, category_id, created_at");

  if (error) {
    throw new Error(`Failed to seed seller_profiles: ${error.message}`);
  }

  console.log(`Seeded/updated ${data?.length ?? 0} sellers.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedSellers()
    .then(() => {
      console.log("Seller seed completed.");
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Seller seed failed: ${message}`);
      process.exit(1);
    });
}