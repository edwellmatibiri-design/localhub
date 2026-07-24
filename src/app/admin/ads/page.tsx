import { createServiceClient } from "@/lib/db";
import {
  AdActionButton,
  AdBudgetEditor,
} from "@/components/ads/AdManageButtons";

type AdRow = {
  id: number;
  vendor_id: string;
  type:
    | "ppc_search"
    | "ppc_listing"
    | "category_ad"
    | "location_ad"
    | "homepage_banner";
  target: string | null;
  bid_amount: number;
  daily_budget: number;
  spent_today: number;
  impressions: number;
  clicks: number;
  status: "active" | "paused" | "exhausted";
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("ads")
    .select(
      "id, vendor_id, type, target, bid_amount, daily_budget, spent_today, impressions, clicks, status, created_at",
    )
    .order("created_at", { ascending: false });

  const ads = (data ?? []) as AdRow[];
  const totalAdRevenue = ads.reduce(
    (sum, ad) => sum + Number(ad.spent_today ?? 0),
    0,
  );

  const spendByVendor = new Map<string, number>();
  ads.forEach((ad) => {
    spendByVendor.set(
      ad.vendor_id,
      (spendByVendor.get(ad.vendor_id) ?? 0) + Number(ad.spent_today ?? 0),
    );
  });

  const topAdvertisers = Array.from(spendByVendor.entries())
    .map(([vendorId, spent]) => ({ vendorId, spent }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Ads Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="card">
          <p className="text-lh-muted text-xs">
            Total ad revenue (spent today)
          </p>
          <p className="text-2xl font-semibold">
            R {totalAdRevenue.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card space-y-1">
          <p className="text-lh-muted text-xs">Top advertisers</p>
          {topAdvertisers.length === 0 ? (
            <p className="text-lh-muted text-sm">No ad spend yet.</p>
          ) : (
            topAdvertisers.map((item) => (
              <p key={item.vendorId} className="text-sm">
                {item.vendorId}: R {item.spent.toLocaleString("en-ZA")}
              </p>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        {ads.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No ads found.</p>
          </div>
        ) : (
          ads.map((ad) => (
            <article key={ad.id} className="card space-y-2">
              <p className="font-medium">
                Ad #{ad.id} ({ad.type})
              </p>
              <p className="text-lh-muted text-sm">Vendor: {ad.vendor_id}</p>
              <p className="text-lh-muted text-sm">
                Target: {ad.target ?? "-"}
              </p>
              <p className="text-lh-muted text-sm">
                Status: <span className="capitalize">{ad.status}</span>
              </p>
              <div className="text-lh-muted grid gap-2 text-sm md:grid-cols-3">
                <p>Bid: R {Number(ad.bid_amount).toLocaleString("en-ZA")}</p>
                <p>
                  Daily budget: R{" "}
                  {Number(ad.daily_budget).toLocaleString("en-ZA")}
                </p>
                <p>
                  Spent today: R{" "}
                  {Number(ad.spent_today).toLocaleString("en-ZA")}
                </p>
                <p>Impressions: {ad.impressions}</p>
                <p>Clicks: {ad.clicks}</p>
                <p>Created: {new Date(ad.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdActionButton
                  adId={ad.id}
                  action="force_pause"
                  label="Force pause"
                  onDone={() => window.location.reload()}
                />
                <AdActionButton
                  adId={ad.id}
                  action="force_resume"
                  label="Force resume"
                  onDone={() => window.location.reload()}
                />
                <AdBudgetEditor
                  adId={ad.id}
                  dailyBudget={Number(ad.daily_budget)}
                  bidAmount={Number(ad.bid_amount)}
                  onDone={() => window.location.reload()}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
