import { sb } from "@/lib/supabase/serverClient";

export async function verifySchema() {
  const tables = [
    "vendor_profiles",
    "reviews",
    "quality_metrics",
    "category_quality",
    "routing_logs",
    "routing_metrics",
    "vendor_availability",
    "schedule_conflicts",
    "scheduling_metrics",
  ];

  const results: Array<{ table: string; exists: boolean; sample: Record<string, unknown> | null }> = [];

  for (const table of tables) {
    const { data, error } = await sb().from(table).select("*").limit(1);
    results.push({
      table,
      exists: !error,
      sample: (data?.[0] as Record<string, unknown> | undefined) ?? null,
    });
  }

  return results;
}