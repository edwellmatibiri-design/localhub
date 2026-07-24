import { createServiceClient } from "@/lib/db";
import AdminListingsClient from "@/components/admin/AdminListingsClient";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const supabase = createServiceClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, seller_id, status, created_at, description, price")
    .order("created_at", { ascending: false })
    .limit(200);

  const sellerIds = Array.from(
    new Set(
      (listings ?? [])
        .map((item) => String(item.seller_id ?? ""))
        .filter(Boolean),
    ),
  );

  const { data: sellers } = sellerIds.length
    ? await supabase
        .from("seller_profiles")
        .select("id, business_name")
        .in("id", sellerIds)
    : { data: [] as { id: string; business_name: string | null }[] };

  const sellerById = new Map(
    (sellers ?? []).map((seller) => [
      seller.id,
      seller.business_name ?? "Unknown vendor",
    ]),
  );

  const rows = (listings ?? []).map((listing) => ({
    id: listing.id,
    title: listing.title,
    vendor: sellerById.get(String(listing.seller_id ?? "")) ?? "Unknown vendor",
    status: listing.status,
    created_at: listing.created_at,
    description: listing.description,
    price: listing.price,
  }));

  return <AdminListingsClient listings={rows} />;
}
