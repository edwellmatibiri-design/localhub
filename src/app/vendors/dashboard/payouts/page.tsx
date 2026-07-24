import { createServiceClient } from "@/lib/db";

type PayoutRow = {
  id: number;
  vendor_id: string;
  booking_id: number;
  amount: number;
  status: "pending" | "paid" | "failed";
  created_at: string;
};

type SearchParams = {
  vendorId?: string;
};

export default async function VendorPayoutsPage({
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

  let payouts: PayoutRow[] = [];
  if (vendorId) {
    const { data } = await supabase
      .from("payouts")
      .select("id, vendor_id, booking_id, amount, status, created_at")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });
    payouts = (data ?? []) as PayoutRow[];
  }

  const pending = payouts.filter((item) => item.status === "pending");
  const completed = payouts.filter((item) => item.status === "paid");
  const totalEarned = completed.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const lastPayoutDate = completed.length ? completed[0].created_at : null;

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Payouts</h1>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Pending payouts</p>
          <p className="text-xl font-semibold">{pending.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Completed payouts</p>
          <p className="text-xl font-semibold">{completed.length}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Total earned</p>
          <p className="text-xl font-semibold">
            R {totalEarned.toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Last payout date</p>
          <p className="text-xl font-semibold">
            {lastPayoutDate
              ? new Date(lastPayoutDate).toLocaleDateString()
              : "-"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {payouts.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No payouts yet.</p>
          </div>
        ) : (
          payouts.map((payout) => (
            <article key={payout.id} className="card space-y-1">
              <p className="font-medium">Booking #{payout.booking_id}</p>
              <p className="text-lh-muted text-sm">
                Amount: R {Number(payout.amount || 0).toLocaleString("en-ZA")}
              </p>
              <p className="text-lh-muted text-sm">
                Status: <span className="capitalize">{payout.status}</span>
              </p>
              <p className="text-lh-muted text-xs">
                {new Date(payout.created_at).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
