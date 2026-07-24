"use server";

import { createServiceClient } from "@/lib/db";

type UpdateListingInput = {
  id: string;
  title: string;
  price: number;
  description: string;
};

type ActionResult = {
  success: boolean;
  status: number;
  message?: string;
};

export async function updateListing(
  input: UpdateListingInput,
): Promise<ActionResult> {
  if (
    !input.id ||
    !input.title.trim() ||
    !input.description.trim() ||
    !Number.isFinite(input.price)
  ) {
    return { success: false, status: 400, message: "Invalid listing payload" };
  }

  const supabase = await createServiceClient();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", input.id)
    .single();

  if (listingError || !listing) {
    return { success: false, status: 404, message: "Listing not found" };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, status: 401, message: "Not authenticated" };
  }

  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("user_id")
    .eq("id", listing.seller_id)
    .single();

  const isOwner = sellerProfile?.user_id === user.id;
  const isAdmin = user.app_metadata?.role === "admin";

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      status: 403,
      message: "Not allowed to update this listing",
    };
  }

  const { error: updateError } = await supabase
    .from("listings")
    .update({
      title: input.title.trim(),
      price: input.price,
      description: input.description.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (updateError) {
    return { success: false, status: 500, message: updateError.message };
  }

  return { success: true, status: 200 };
}
