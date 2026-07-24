"use server";

import { createServiceClient } from "@/lib/db";

export async function moderateListing(
  id: string,
  status: "approved" | "rejected",
) {
  const supabase = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    return { success: false, status: 403, message: "Not authorized" };
  }

  const { error } = await supabase
    .from("listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, status: 500, message: error.message };
  }

  return { success: true };
}
