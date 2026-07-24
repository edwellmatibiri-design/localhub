import { appFail, appOk, parseBody, requireAuthenticatedUser } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit/log";
import { createServiceClient } from "@/lib/db";
import { toListingDTO } from "@/lib/dtos/listing";
import { revalidateCategoryAndIntentPages } from "@/lib/seo/revalidation";
import { revalidatePath } from "next/cache";

type Body = {
  id?: string;
  title?: string;
  description?: string;
  price?: number;
};

export async function POST(request: Request) {
  const auth = requireAuthenticatedUser(request);
  if ("status" in auth) {
    return auth;
  }

  const body = await parseBody<Body>(request);
  const listingId = String(body?.id ?? "").trim();

  if (!listingId) {
    return appFail(400, "Listing id is required");
  }

  const supabase = createServiceClient();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select(
      "id, seller_id, category_id, suburb_id, title, description, price, is_active, status, updated_at",
    )
    .eq("id", listingId)
    .maybeSingle();

  if (listingError) {
    return appFail(500, listingError.message);
  }

  if (!listing) {
    return appFail(404, "Listing not found");
  }

  const { data: seller, error: sellerError } = await supabase
    .from("seller_profiles")
    .select("id, user_id")
    .eq("id", listing.seller_id)
    .maybeSingle();

  if (sellerError) {
    return appFail(500, sellerError.message);
  }

  if (!seller || seller.user_id !== auth.userId) {
    await writeAuditLog({
      actorId: auth.userId,
      action: "vendor_listing_update_denied",
      resourceType: "listing",
      resourceId: listingId,
    });

    return appFail(403, "Not allowed to update this listing");
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body?.title === "string") {
    const normalized = body.title.trim();
    if (!normalized) return appFail(400, "Title is required");
    patch.title = normalized;
  }

  if (typeof body?.description === "string") {
    const normalized = body.description.trim();
    if (!normalized) return appFail(400, "Description is required");
    patch.description = normalized;
  }

  if (typeof body?.price === "number") {
    if (!Number.isFinite(body.price) || body.price < 0)
      return appFail(400, "Price must be a valid positive number");
    patch.price = body.price;
  }

  const { data: updated, error: updateError } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", listingId)
    .select(
      "id, seller_id, title, description, price, is_active, status, updated_at",
    )
    .single();

  if (updateError) {
    return appFail(500, updateError.message);
  }

  await writeAuditLog({
    actorId: auth.userId,
    action: "vendor_listing_updated",
    resourceType: "listing",
    resourceId: listingId,
    metadata: { fields: Object.keys(patch) },
  });

  if (listing.category_id && listing.suburb_id) {
    const [{ data: category }, { data: suburb }] = await Promise.all([
      supabase
        .from("categories")
        .select("slug")
        .eq("id", listing.category_id)
        .maybeSingle(),
      supabase
        .from("suburbs")
        .select("slug, city")
        .eq("id", listing.suburb_id)
        .maybeSingle(),
    ]);

    if (category?.slug && suburb?.slug && suburb?.city) {
      const citySlug = String(suburb.city).toLowerCase().replace(/\s+/g, "-");
      revalidateCategoryAndIntentPages(
        {
          category: category.slug,
          city: citySlug,
          suburb: suburb.slug,
        },
        revalidatePath,
      );
    }
  }

  return appOk(toListingDTO(updated));
}
