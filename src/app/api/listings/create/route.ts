import { appFail, parseBody } from "@/lib/api";
import { createServiceClient } from "@/lib/db";
import { NextResponse } from "next/server";

type CreateListingBody = {
  seller_id?: string;
  sellerId?: string;
  title?: string;
  category_id?: string | null;
  suburb_id?: string | null;
  description?: string;
  price?: number | string;
  priceRange?: string;
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

function normalizePrice(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function normalizePriceRange(value: string | undefined): number {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const rangeMatch = raw.match(/(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return Number(((min + max) / 2).toFixed(2));
    }
  }

  const single = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(single) ? single : 0;
}

export async function POST(request: Request) {
  const supabase = await createServiceClient();
  const body = await parseBody<CreateListingBody>(request);
  const sellerId = String(body?.sellerId ?? body?.seller_id ?? "").trim();
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();

  if (!sellerId) {
    return appFail(400, "Seller id is required");
  }

  if (!title) {
    return appFail(400, "Title is required");
  }

  if (!description) {
    return appFail(400, "Description is required");
  }

  const payload = {
    seller_id: sellerId,
    title,
    category_id: normalizeNullableUuid(body?.category_id),
    suburb_id: normalizeNullableUuid(body?.suburb_id),
    description,
    price: body?.priceRange
      ? normalizePriceRange(body.priceRange)
      : normalizePrice(body?.price),
    images: Array.isArray(body?.images)
      ? body.images.filter(
          (image): image is string => typeof image === "string",
        )
      : [],
    is_active: typeof body?.is_active === "boolean" ? body.is_active : true,
    status: "pending_review",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("listings")
    .insert(payload)
    .select(
      "id, seller_id, title, category_id, suburb_id, description, price, images, is_active, created_at, updated_at",
    )
    .single();

  if (error) {
    return appFail(500, error.message);
  }

  return NextResponse.json({ ok: true, listingId: data.id }, { status: 201 });
}
