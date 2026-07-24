import Link from "next/link";
import { createServiceClient } from "@/lib/db";

type BoostRow = {
  id: number;
  vendor_id: string;
  type:
    | "search_boost"
    | "featured_vendor"
    | "featured_listing"
    | "category_sponsor"
    | "location_sponsor";
  target: string | null;
  amount: number;
  status: "active" | "expired" | "pending_payment";
  start_date: string;
  end_date: string;
  created_at: string;
};

type SearchParams = {
  vendorId?: string;
};

const boostLinks = [
  {
    href: "/vendors/dashboard/boosts/purchase/search_boost",
    label: "Buy Search Boost",
  },
  {
    href: "/vendors/dashboard/boosts/purchase/featured_vendor",
    label: "Buy Featured Vendor",
  },
  {
    href: "/vendors/dashboard/boosts/purchase/featured_listing",
    label: "Buy Featured Listing",
  },
  {
    href: "/vendors/dashboard/boosts/purchase/category_sponsor",
    label: "Sponsor Category",
  },
  {
    href: "/vendors/dashboard/boosts/purchase/location_sponsor",
    label: "Sponsor Location",
  },
];

export const dynamic = "force-dynamic";

export default async function VendorBoostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  const requestedVendorId = String(params.vendorId ?? "").trim();
  const vendorId =
    requestedVendorId ||
    String(
      (
        await supabase
          .from("seller_profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data?.id ?? "",
    );

  let boosts: BoostRow[] = [];
  if (vendorId) {
    const { data } = await supabase
      .from("boosts")
      .select(
        "id, vendor_id, type, target, amount, status, start_date, end_date, created_at",
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });
    boosts = (data ?? []) as BoostRow[];
  }

  const now = Date.now();
  const activeBoosts = boosts.filter(
    (boost) => boost.status === "active" && Date.parse(boost.end_date) > now,
  );
  const pendingBoosts = boosts.filter(
    (boost) => boost.status === "pending_payment",
  );
  const expiredBoosts = boosts.filter(
    (boost) => boost.status === "expired" || Date.parse(boost.end_date) <= now,
  );

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Boosts</h1>

      <div className="card flex flex-wrap gap-2">
        {boostLinks.map((link) => (
          <Link
            key={link.href}
            href={`${link.href}?vendorId=${encodeURIComponent(vendorId)}`}
            className="border-lh-border rounded-lg border px-3 py-2 text-sm font-medium"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Active Boosts</h2>
        {activeBoosts.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No active boosts.</p>
          </div>
        ) : (
          activeBoosts.map((boost) => (
            <article key={boost.id} className="card space-y-1">
              <p className="font-medium">{boost.type}</p>
              <p className="text-lh-muted text-sm">
                Target: {boost.target ?? "-"}
              </p>
              <p className="text-lh-muted text-sm">
                Amount: R {Number(boost.amount).toLocaleString("en-ZA")}
              </p>
              <p className="text-lh-muted text-xs">
                Ends: {new Date(boost.end_date).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Pending Boosts</h2>
        {pendingBoosts.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No pending boosts.</p>
          </div>
        ) : (
          pendingBoosts.map((boost) => (
            <article key={boost.id} className="card space-y-1">
              <p className="font-medium">{boost.type}</p>
              <p className="text-lh-muted text-sm">
                Target: {boost.target ?? "-"}
              </p>
              <p className="text-lh-muted text-sm">
                Amount: R {Number(boost.amount).toLocaleString("en-ZA")}
              </p>
              <p className="text-lh-muted text-xs">
                Created: {new Date(boost.created_at).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Expired Boosts</h2>
        {expiredBoosts.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No expired boosts.</p>
          </div>
        ) : (
          expiredBoosts.map((boost) => (
            <article key={boost.id} className="card space-y-1">
              <p className="font-medium">{boost.type}</p>
              <p className="text-lh-muted text-sm">
                Target: {boost.target ?? "-"}
              </p>
              <p className="text-lh-muted text-sm">
                Amount: R {Number(boost.amount).toLocaleString("en-ZA")}
              </p>
              <p className="text-lh-muted text-xs">
                Ended: {new Date(boost.end_date).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
