import { createServiceClient } from "@/lib/db";
import { isListingExpired } from "@/lib/listings/state";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, seller_id, title, description, price, is_active, status, expires_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json(
      { ok: false, error: "Listing not found" },
      { status: 404 },
    );
  }

  if (isListingExpired(data)) {
    return Response.json(
      { ok: false, error: "Listing expired" },
      { status: 410 },
    );
  }

  return Response.json({ ok: true, data }, { status: 200 });
}
