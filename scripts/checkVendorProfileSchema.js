import { createClient } from "@supabase/supabase-js";

// Columns your seed script expects
const expectedColumns = [
  "id",
  "user_id",
  "business_name",
  "display_name",
  "contact_email",
  "contact_phone",
  "category_id",
  "suburb_id",
  "description",
  "logo_url",
  "flagged",
  "created_at",
  "location",
  "risk_score",
  "verified"
];

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.rpc("introspection_get_columns", {
    table_name: "vendor_profiles"
  });

  if (error) {
    console.log("vendor_profiles table does NOT exist.");
    console.log(error);
    return;
  }

  const existing = data.map((c) => c.column_name);
  const missing = expectedColumns.filter((col) => !existing.includes(col));

  console.log("Existing columns:", existing);
  console.log("Missing columns:", missing);

  if (missing.length === 0) {
    console.log("Schema is complete.");
    return;
  }

  console.log("\n--- SQL to fix missing columns ---\n");

  missing.forEach((col) => {
    let type = "text";

    if (col === "risk_score") type = "numeric";
    if (col === "verified") type = "boolean default false";

    console.log(`alter table vendor_profiles add column ${col} ${type};`);
  });
}

main();
