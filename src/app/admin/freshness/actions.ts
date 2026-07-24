"use server";

import { sb } from "@/lib/supabase/serverClient";

export async function updateFreshness(vendorId: string) {
  const query = sb()
    .from("vendor_profiles")
    .update({ freshness_updated_at: new Date().toISOString() });

  if (vendorId) {
    await query.eq("id", vendorId);
  } else {
    await query;
  }

  return { ok: true };
}
