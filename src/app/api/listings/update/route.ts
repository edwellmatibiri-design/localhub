import { appFail, appOk, parseBody } from "@/lib/api";
import { createServiceClient } from "@/lib/db";

type UpdateListingBody = {
  id?: string;
  title?: string;
  category_id?: string | null;
  suburb_id?: string | null;
  description?: string;
  price?: number | string;
  images?: string[];
  is_active?: boolean;
};

function normalizeNullableUuid(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

async function update(request: Request) {
  const supabase = await createServiceClient();
  const body = await parseBody<UpdateListingBody>(request);
  const id = String(body?.id ?? "");
  if (!id) {
    return appFail(400, "Listing id is required");
  }

  const patch: {
    title?: string;
    category_id?: string | null;
    suburb_id?: string | null;
    description?: string;
    price?: number;
    images?: string[];
    is_active?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body?.title === "string") {
    patch.title = body.title.trim();
  }

  if (typeof body?.description === "string") {
    patch.description = body.description.trim();
  }

  if (body && "category_id" in body) {
    patch.category_id = normalizeNullableUuid(body.category_id);
  }

  if (body && "suburb_id" in body) {
    patch.suburb_id = normalizeNullableUuid(body.suburb_id);
  }

  if (body && "is_active" in body && typeof body.is_active === "boolean") {
    patch.is_active = body.is_active;
  }

  if (body && "images" in body && Array.isArray(body.images)) {
    patch.images = body.images.filter(
      (image): image is string => typeof image === "string",
    );
  }

  if (body && "price" in body) {
    const parsedPrice = normalizePrice(body.price);
    if (parsedPrice === null) {
      return appFail(400, "Price must be a valid number");
    }
    patch.price = parsedPrice;
  }

  if (patch.title !== undefined && !patch.title) {
    return appFail(400, "Title is required");
  }

  if (patch.description !== undefined && !patch.description) {
    return appFail(400, "Description is required");
  }

  const { data, error } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", id)
    .select(
      "id, seller_id, title, category_id, suburb_id, description, price, images, is_active, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    return appFail(500, error.message);
  }

  if (!data) {
    return appFail(404, "Listing not found");
  }

  return appOk(data);
}

export async function POST(request: Request) {
  return update(request);
}

export async function PATCH(request: Request) {
  return update(request);
}
