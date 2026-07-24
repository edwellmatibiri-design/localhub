import Link from "next/link";
import { createServiceClient } from "@/lib/db";

type SearchParams = {
  vendorId?: string;
};

function badgeFor(score: number) {
  if (score >= 85) return "gold";
  if (score >= 70) return "silver";
  if (score >= 50) return "bronze";
  return "none";
}

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  const requestedVendorId = String(params.vendorId ?? "").trim();
  const profileQuery = supabase
    .from("seller_profiles")
    .select(
      "id, business_name, contact_email, contact_phone, description, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: profile } = requestedVendorId
    ? await supabase
        .from("seller_profiles")
        .select(
          "id, business_name, contact_email, contact_phone, description, created_at",
        )
        .eq("id", requestedVendorId)
        .maybeSingle()
    : await profileQuery.maybeSingle();

  if (!profile) {
    return (
      <section className="shell p-6">
        <div className="card space-y-3">
          <h1 className="text-2xl font-semibold">Vendor Dashboard</h1>
          <p className="text-lh-muted text-sm">
            No vendor profile found yet. Complete onboarding first.
          </p>
          <Link
            href="/vendors/onboard"
            className="bg-lh-accent text-lh-on-accent inline-block rounded-lg px-4 py-2 text-sm font-medium"
          >
            Start Onboarding
          </Link>
        </div>
      </section>
    );
  }

  const [{ data: trust }, { data: listings }] = await Promise.all([
    supabase
      .from("vendor_trust_scores")
      .select("trust_score")
      .eq("vendor_id", profile.id)
      .maybeSingle(),
    supabase
      .from("listings")
      .select("id, title, status, created_at")
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const trustScore = Number(trust?.trust_score ?? 0);
  const badge = badgeFor(trustScore);

  return (
    <section className="shell space-y-4 p-6">
      <div className="card space-y-2">
        <h1 className="text-2xl font-semibold">Vendor Dashboard</h1>
        <p className="text-lh-muted text-sm">{profile.business_name}</p>
        <p className="text-lh-muted text-sm">
          {profile.contact_email ?? "No email"} |{" "}
          {profile.contact_phone ?? "No phone"}
        </p>
        <p className="text-sm">{profile.description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">
          <p className="text-lh-muted text-xs tracking-wide uppercase">
            Trust Score
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {Math.round(trustScore)}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs tracking-wide uppercase">Badge</p>
          <p className="mt-2 text-2xl font-semibold capitalize">{badge}</p>
        </div>
        <div className="card flex items-center">
          <Link
            href={`/vendors/listings/create?vendorId=${profile.id}`}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
          >
            Create Listing
          </Link>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Listings</h2>
        {(listings ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No listings yet.</p>
        ) : (
          <ul className="space-y-2">
            {(listings ?? []).map((listing) => (
              <li
                key={listing.id}
                className="border-lh-border rounded-lg border p-3"
              >
                <p className="font-medium">{listing.title}</p>
                <p className="text-lh-muted text-sm">
                  Status: {listing.status ?? "pending"}
                </p>
                <p className="text-lh-muted text-xs">
                  Created: {new Date(listing.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
