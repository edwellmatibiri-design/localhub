import { createServiceClient } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminModerationClient from "@/components/admin/AdminModerationClient";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const supabase = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect("/");
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, seller_id, status, created_at")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
    .limit(100);

  const sellerIds = Array.from(
    new Set(
      (listings ?? [])
        .map((listing) => String(listing.seller_id ?? ""))
        .filter(Boolean),
    ),
  );

  const [{ data: sellers }, { data: trustRows }] = await Promise.all([
    sellerIds.length
      ? supabase
          .from("seller_profiles")
          .select("id, business_name")
          .in("id", sellerIds)
      : Promise.resolve({
          data: [] as { id: string; business_name: string | null }[],
        }),
    sellerIds.length
      ? supabase
          .from("vendor_trust_scores")
          .select("vendor_id, trust_score")
          .in("vendor_id", sellerIds)
      : Promise.resolve({
          data: [] as { vendor_id: string; trust_score: number }[],
        }),
  ]);

  const sellerById = new Map(
    (sellers ?? []).map((item) => [
      item.id,
      item.business_name ?? "Unknown vendor",
    ]),
  );
  const trustById = new Map(
    (trustRows ?? []).map((item) => [
      String(item.vendor_id),
      Number(item.trust_score) || 0,
    ]),
  );

  const rows = (listings ?? []).map((listing) => ({
    id: listing.id,
    title: listing.title,
    vendor: sellerById.get(String(listing.seller_id ?? "")) ?? "Unknown vendor",
    trustScore: trustById.get(String(listing.seller_id ?? "")) ?? 0,
    status: listing.status,
    created_at: listing.created_at,
  }));

  return <AdminModerationClient listings={rows} />;
}
