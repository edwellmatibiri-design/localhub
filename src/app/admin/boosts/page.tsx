import { createServiceClient } from "@/lib/db";
import BoostStatusButton from "@/components/admin/BoostStatusButton";

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
  end_date: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminBoostsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("boosts")
    .select("id, vendor_id, type, target, amount, status, end_date, created_at")
    .order("created_at", { ascending: false });

  const boosts = (data ?? []) as BoostRow[];

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Boosts</h1>

      {boosts.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No boosts found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {boosts.map((boost) => (
            <article key={boost.id} className="card space-y-2">
              <p className="font-medium">Boost #{boost.id}</p>
              <p className="text-lh-muted text-sm">Vendor: {boost.vendor_id}</p>
              <p className="text-lh-muted text-sm">Type: {boost.type}</p>
              <p className="text-lh-muted text-sm">
                Target: {boost.target ?? "-"}
              </p>
              <p className="text-lh-muted text-sm">
                Amount: R {Number(boost.amount || 0).toLocaleString("en-ZA")}
              </p>
              <p className="text-lh-muted text-sm">
                Status: <span className="capitalize">{boost.status}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <BoostStatusButton boostId={boost.id} action="force_activate" />
                <BoostStatusButton boostId={boost.id} action="force_expire" />
              </div>
              <p className="text-lh-muted text-xs">
                Ends: {new Date(boost.end_date).toLocaleString()}
              </p>
              <p className="text-lh-muted text-xs">
                Created: {new Date(boost.created_at).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
