"use server";

import { createServiceClient } from "@/lib/db";

type CreateListingInput = {
  title: string;
  price: number;
  description: string;
};

type ActionResult = {
  success: boolean;
  status: number;
  message?: string;
};

export async function createListing(
  input: CreateListingInput,
): Promise<ActionResult> {
  if (
    !input.title.trim() ||
    !input.description.trim() ||
    !Number.isFinite(input.price)
  ) {
    return { success: false, status: 400, message: "Invalid listing payload" };
  }

  const supabase = await createServiceClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, status: 401, message: "Not authenticated" };
  }

  const { data: sellerProfile, error: sellerError } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (sellerError || !sellerProfile) {
    return { success: false, status: 403, message: "Seller profile not found" };
  }

  const { error: insertError } = await supabase.from("listings").insert({
    title: input.title.trim(),
    price: input.price,
    description: input.description.trim(),
    seller_id: sellerProfile.id,
    status: "pending_review",
    images: [],
    is_active: true,
  });

  if (insertError) {
    return { success: false, status: 500, message: insertError.message };
  }

  return { success: true, status: 201 };
}
