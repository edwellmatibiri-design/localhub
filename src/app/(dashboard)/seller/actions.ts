"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type ActionResult = {
  ok: boolean;
  error?: string;
};

function toTrimmedString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableString(value: FormDataEntryValue | null): string | null {
  const normalized = toTrimmedString(value);
  return normalized || null;
}

function toPrice(value: FormDataEntryValue | null): number | null {
  const normalized = toTrimmedString(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function postListingMutation(
  path: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    `http://${headerStore.get("host") ?? "localhost:3000"}`;
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const json = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || !json.ok) {
    return { ok: false, error: json.error ?? "Request failed" };
  }

  return { ok: true };
}

export async function saveListingEdit(formData: FormData): Promise<void> {
  const id = toTrimmedString(formData.get("id"));
  const title = toTrimmedString(formData.get("title"));
  const description = toTrimmedString(formData.get("description"));
  const price = toPrice(formData.get("price"));

  if (!id) {
    throw new Error("Listing id is required");
  }

  if (!title) {
    throw new Error("Title is required");
  }

  if (!description) {
    throw new Error("Description is required");
  }

  if (price === null) {
    throw new Error("Price must be a valid number");
  }

  const result = await postListingMutation("/api/listings/update", {
    id,
    title,
    description,
    price,
    category_id: toNullableString(formData.get("category_id")),
    suburb_id: toNullableString(formData.get("suburb_id")),
    is_active: toTrimmedString(formData.get("is_active")) !== "false",
  });

  if (result.ok) {
    revalidatePath("/seller");
    return;
  }

  throw new Error(result.error ?? "Failed to update listing");
}

export async function saveListingCreate(formData: FormData): Promise<void> {
  const sellerId = toTrimmedString(formData.get("seller_id"));
  const title = toTrimmedString(formData.get("title"));
  const description = toTrimmedString(formData.get("description"));
  const price = toPrice(formData.get("price"));

  if (!sellerId) {
    throw new Error("Seller id is required");
  }

  if (!title) {
    throw new Error("Title is required");
  }

  if (!description) {
    throw new Error("Description is required");
  }

  if (price === null) {
    throw new Error("Price must be a valid number");
  }

  const result = await postListingMutation("/api/listings/create", {
    seller_id: sellerId,
    title,
    description,
    price,
    category_id: toNullableString(formData.get("category_id")),
    suburb_id: toNullableString(formData.get("suburb_id")),
    is_active: toTrimmedString(formData.get("is_active")) !== "false",
  });

  if (result.ok) {
    revalidatePath("/seller");
    return;
  }

  throw new Error(result.error ?? "Failed to create listing");
}
