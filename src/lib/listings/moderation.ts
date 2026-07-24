import { createServiceClient } from "@/lib/db";

async function ensureAdmin() {
  const supabase = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    throw new Error("Not authorized");
  }

  return supabase;
}

export async function approveListing(listingId: string) {
  const supabase = await ensureAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}

export async function rejectListing(listingId: string) {
  const supabase = await ensureAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}
