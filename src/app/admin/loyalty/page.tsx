import { createServiceClient } from "@/lib/db";
import AdminLoyaltyActions from "@/components/loyalty/AdminLoyaltyActions";

export const dynamic = "force-dynamic";

export default async function AdminLoyaltyPage() {
  const supabase = createServiceClient();

  const [
    { data: transactions },
    { data: loyaltyRows },
    { data: referralRows },
    { data: badgesRows },
  ] = await Promise.all([
    supabase
      .from("points_transactions")
      .select("user_id, points, type, created_at")
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("loyalty_points")
      .select("user_id, points, lifetime_points, tier, updated_at")
      .order("lifetime_points", { ascending: false })
      .limit(5000),
    supabase
      .from("referrals")
      .select("id, referrer_id, referred_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("badges")
      .select("user_id, badge, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const totalPointsIssued = (transactions ?? []).reduce(
    (sum, row) => sum + Math.max(0, Number(row.points ?? 0)),
    0,
  );

  const topUsers = [...(loyaltyRows ?? [])]
    .sort(
      (a, b) => Number(b.lifetime_points ?? 0) - Number(a.lifetime_points ?? 0),
    )
    .slice(0, 20);

  const referralCompleted = (referralRows ?? []).filter(
    (row) => row.status === "completed",
  ).length;
  const referralPending = (referralRows ?? []).filter(
    (row) => row.status === "pending",
  ).length;

  const referralsByReferrer = new Map<string, number>();
  for (const row of referralRows ?? []) {
    const referrerId = String(row.referrer_id ?? "");
    if (!referrerId) continue;
    if (row.status !== "completed") continue;
    referralsByReferrer.set(
      referrerId,
      (referralsByReferrer.get(referrerId) ?? 0) + 1,
    );
  }

  const topReferrers = Array.from(referralsByReferrer.entries())
    .map(([referrerId, completed]) => ({ referrerId, completed }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 20);

  const tierDistribution = {
    bronze: (loyaltyRows ?? []).filter((row) => row.tier === "bronze").length,
    silver: (loyaltyRows ?? []).filter((row) => row.tier === "silver").length,
    gold: (loyaltyRows ?? []).filter((row) => row.tier === "gold").length,
    platinum: (loyaltyRows ?? []).filter((row) => row.tier === "platinum")
      .length,
  };

  const badgesByUser = new Map<string, number>();
  for (const row of badgesRows ?? []) {
    const userId = String(row.user_id ?? "");
    if (!userId) continue;
    badgesByUser.set(userId, (badgesByUser.get(userId) ?? 0) + 1);
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Loyalty Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Total points issued</p>
          <p className="text-xl font-semibold">{totalPointsIssued}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Referral completed</p>
          <p className="text-xl font-semibold">{referralCompleted}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Referral pending</p>
          <p className="text-xl font-semibold">{referralPending}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Users in loyalty</p>
          <p className="text-xl font-semibold">{(loyaltyRows ?? []).length}</p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Tier distribution</h2>
        <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
          <p>Bronze: {tierDistribution.bronze}</p>
          <p>Silver: {tierDistribution.silver}</p>
          <p>Gold: {tierDistribution.gold}</p>
          <p>Platinum: {tierDistribution.platinum}</p>
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Top users</h2>
        {topUsers.length === 0 ? (
          <p className="text-lh-muted text-sm">No loyalty users found.</p>
        ) : (
          topUsers.map((row) => (
            <article
              key={String(row.user_id)}
              className="border-lh-border space-y-2 rounded border p-3 text-sm"
            >
              <div className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
                <p>
                  <span className="font-medium">User:</span>{" "}
                  {String(row.user_id)}
                </p>
                <p>
                  <span className="font-medium">Points:</span>{" "}
                  {Number(row.points ?? 0)}
                </p>
                <p>
                  <span className="font-medium">Lifetime:</span>{" "}
                  {Number(row.lifetime_points ?? 0)}
                </p>
                <p>
                  <span className="font-medium">Tier:</span>{" "}
                  <span className="capitalize">
                    {String(row.tier ?? "bronze")}
                  </span>
                </p>
              </div>
              <p className="text-lh-muted text-xs">
                Badges: {badgesByUser.get(String(row.user_id)) ?? 0}
              </p>
              <AdminLoyaltyActions userId={String(row.user_id)} />
            </article>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Referral performance</h2>
        {topReferrers.length === 0 ? (
          <p className="text-lh-muted text-sm">No completed referrals yet.</p>
        ) : (
          topReferrers.map((row) => (
            <article
              key={row.referrerId}
              className="border-lh-border rounded border p-3 text-sm"
            >
              <p className="font-medium">Referrer: {row.referrerId}</p>
              <p className="text-lh-muted">
                Completed referrals: {row.completed}
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
