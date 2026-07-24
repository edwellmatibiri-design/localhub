"use server";

import { createServiceClient } from "@/lib/db";

export async function ensureSellerProfile(
  userId: string,
  email?: string | null,
) {
  const supabase = await createServiceClient();

  const { data: profile } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile) {
    return profile;
  }

  const businessName = email?.split("@")[0] ?? "New Seller";

  const { data, error } = await supabase
    .from("seller_profiles")
    .insert({
      user_id: userId,
      business_name: businessName,
      description: "",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
