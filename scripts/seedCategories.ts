import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

type CategorySeed = {
  name: string;
  slug: string;
};

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const categorySeeds: CategorySeed[] = [
  { name: "Electrical Services", slug: "electrical-services" },
  { name: "Plumbing", slug: "plumbing" },
  { name: "Home Cleaning", slug: "home-cleaning" },
  { name: "Landscaping", slug: "landscaping" },
  { name: "Painting & Renovation", slug: "painting-renovation" },
  { name: "Security Systems", slug: "security-systems" },
  { name: "Roof Repair", slug: "roof-repair" },
  { name: "Flooring", slug: "flooring" },
  { name: "HVAC", slug: "hvac" },
  { name: "General Contracting", slug: "general-contracting" },
];

export async function seedCategories() {
  const supabase = createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const { data, error } = await supabase
    .from("categories")
    .upsert(categorySeeds, { onConflict: "slug", ignoreDuplicates: false })
    .select("id, name, slug");

  if (error) {
    throw new Error(`Failed to seed categories: ${error.message}`);
  }

  console.log(`Seeded/updated ${data?.length ?? 0} categories.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedCategories()
    .then(() => {
      console.log("Categories seed completed.");
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Categories seed failed: ${message}`);
      process.exit(1);
    });
}