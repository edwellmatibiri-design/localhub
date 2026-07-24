import { createServiceClient } from "@/lib/db";
import {
  AdActionButton,
  AdBudgetEditor,
} from "@/components/ads/AdManageButtons";

type SearchParams = { vendorId?: string };

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
  end_date: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function VendorAdsPage({
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

  const { data } = vendorId
    ? await supabase
        .from("ads")
        .select(
          "id, vendor_id, type, target, bid_amount, daily_budget, spent_today, impressions, clicks, status, end_date, created_at",
        )
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
    : { data: [] as AdRow[] };

  const ads = (data ?? []) as AdRow[];
  const activeAds = ads.filter((ad) => ad.status === "active");
  const pausedAds = ads.filter((ad) => ad.status === "paused");
  const exhaustedAds = ads.filter((ad) => ad.status === "exhausted");

  function ctr(ad: AdRow) {
    const imp = Number(ad.impressions ?? 0);
    const clk = Number(ad.clicks ?? 0);
    return imp > 0 ? ((clk / imp) * 100).toFixed(2) : "0.00";
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Ads Dashboard</h1>

      {[
        { label: "Active Ads", rows: activeAds },
        { label: "Paused Ads", rows: pausedAds },
        { label: "Exhausted Ads", rows: exhaustedAds },
      ].map((group) => (
        <section key={group.label} className="space-y-2">
          <h2 className="text-lg font-semibold">{group.label}</h2>
          {group.rows.length === 0 ? (
            <div className="card">
              <p className="text-lh-muted text-sm">No ads in this status.</p>
            </div>
          ) : (
            group.rows.map((ad) => (
              <article key={ad.id} className="card space-y-2">
                <p className="font-medium">
                  Ad #{ad.id} ({ad.type})
                </p>
                <p className="text-lh-muted text-sm">
                  Target: {ad.target ?? "-"}
                </p>
                <div className="text-lh-muted grid gap-2 text-sm md:grid-cols-3">
                  <p>Impressions: {ad.impressions}</p>
                  <p>Clicks: {ad.clicks}</p>
                  <p>CTR: {ctr(ad)}%</p>
                  <p>
                    Spend today: R{" "}
                    {Number(ad.spent_today).toLocaleString("en-ZA")}
                  </p>
                  <p>
                    Remaining budget: R{" "}
                    {Math.max(
                      0,
                      Number(ad.daily_budget) - Number(ad.spent_today),
                    ).toLocaleString("en-ZA")}
                  </p>
                  <p>Ends: {new Date(ad.end_date).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ad.status === "active" ? (
                    <AdActionButton
                      adId={ad.id}
                      action="pause"
                      label="Pause ad"
                      onDone={() => window.location.reload()}
                    />
                  ) : null}
                  {ad.status !== "active" ? (
                    <AdActionButton
                      adId={ad.id}
                      action="resume"
                      label="Resume ad"
                      onDone={() => window.location.reload()}
                    />
                  ) : null}
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
        </section>
      ))}
    </section>
  );
}
