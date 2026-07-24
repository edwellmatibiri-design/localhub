"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";

type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
};

type LeadRow = {
  id: string;
  listing_id: string;
  seller_id: string;
  user_id: string;
  status: string;
};

type BookingRow = {
  id: string;
  vendor_id: string;
  user_id: string;
  preferred_date: string;
  status: string;
};

type VendorRow = {
  id: string;
  business_name: string;
};

export default function AccountDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedListings, setSavedListings] = useState<ListingRow[]>([]);
  const [savedVendors, setSavedVendors] = useState<VendorRow[]>([]);
  const [activeBookings, setActiveBookings] = useState<BookingRow[]>([]);
  const [pastBookings, setPastBookings] = useState<BookingRow[]>([]);
  const [trustBadges, setTrustBadges] = useState<string[]>([]);
  const [reputationBadges, setReputationBadges] = useState<string[]>([]);
  const [smartNotifications, setSmartNotifications] = useState<
    Array<{ type: string; message: string }>
  >([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const userId = String(auth?.user?.id ?? "");

        const [listingsResponse, leadsResponse] = await Promise.all([
          fetch("/api/listings/list", { cache: "no-store" }),
          fetch("/api/leads/list", { cache: "no-store" }),
        ]);

        const listingsPayload = await listingsResponse.json();
        const leadsPayload = await leadsResponse.json();

        const listings = (listingsPayload?.data ?? []) as ListingRow[];
        const leads = (leadsPayload?.data ?? []) as LeadRow[];

        const userLeads = userId
          ? leads.filter((lead) => lead.user_id === userId)
          : leads;
        const savedListingIds = new Set(
          userLeads.map((lead) => lead.listing_id),
        );
        const savedSellerIds = new Set(userLeads.map((lead) => lead.seller_id));

        setSavedListings(
          listings
            .filter((listing) => savedListingIds.has(listing.id))
            .slice(0, 8),
        );

        if (savedSellerIds.size > 0) {
          const { data: vendors, error: vendorsError } = await supabase
            .from("seller_profiles")
            .select("id, business_name")
            .in("id", Array.from(savedSellerIds));

          if (vendorsError) {
            throw vendorsError;
          }

          setSavedVendors((vendors ?? []) as VendorRow[]);
        } else {
          setSavedVendors([]);
        }

        if (userId) {
          const { data: trust } = await supabase
            .from("user_trust_profile")
            .select("trust_score, phone_verified, email_verified")
            .eq("user_id", userId)
            .maybeSingle();

          const badges: string[] = [];
          if (Boolean(trust?.phone_verified)) badges.push("Phone Verified");
          if (Boolean(trust?.email_verified)) badges.push("Email Verified");
          if (Number(trust?.trust_score ?? 50) >= 70)
            badges.push("Trusted User");
          if (Number(trust?.trust_score ?? 50) >= 90)
            badges.push("Premium User");
          setTrustBadges(badges);

          const { data: reputation } = await supabase
            .from("user_reputation")
            .select(
              "reputation_score, completed_bookings, cancelled_bookings, on_time_payments, late_payments",
            )
            .eq("user_id", userId)
            .maybeSingle();

          const repBadges: string[] = [];
          const repScore = Number(reputation?.reputation_score ?? 50);
          if (repScore >= 61) repBadges.push("Trusted User");
          if (repScore >= 81) repBadges.push("Premium User");
          if (
            Number(reputation?.completed_bookings ?? 0) >= 5 &&
            Number(reputation?.cancelled_bookings ?? 0) === 0
          )
            repBadges.push("Reliable Booker");
          if (
            Number(reputation?.on_time_payments ?? 0) > 0 &&
            Number(reputation?.late_payments ?? 0) === 0
          )
            repBadges.push("Perfect Payment Record");
          setReputationBadges(repBadges);

          const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("id, vendor_id, user_id, preferred_date, status")
            .eq("user_id", userId)
            .order("preferred_date", { ascending: false });

          if (bookingsError) {
            throw bookingsError;
          }

          const rows = (bookings ?? []) as BookingRow[];
          setActiveBookings(
            rows.filter(
              (row) => row.status !== "completed" && row.status !== "cancelled",
            ),
          );
          setPastBookings(
            rows.filter(
              (row) => row.status === "completed" || row.status === "cancelled",
            ),
          );

          const smartResponse = await fetch(
            `/api/notifications/smart?userId=${encodeURIComponent(userId)}`,
            { cache: "no-store" },
          );
          const smartPayload = await smartResponse.json();
          if (smartResponse.ok && smartPayload?.ok) {
            setSmartNotifications(
              (smartPayload.notifications ?? []) as Array<{
                type: string;
                message: string;
              }>,
            );
          }
        } else {
          setActiveBookings([]);
          setPastBookings([]);
          setSmartNotifications([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const activeCount = useMemo(() => activeBookings.length, [activeBookings]);

  return (
    <section className="shell space-y-4 p-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">Account Dashboard</h1>
        <p className="text-lh-muted text-sm">Active bookings: {activeCount}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {trustBadges.length === 0 ? (
            <span className="text-lh-muted text-xs">No trust badges yet.</span>
          ) : (
            trustBadges.map((badge) => (
              <span key={badge} className="badge">
                {badge}
              </span>
            ))
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {reputationBadges.length === 0 ? (
            <span className="text-lh-muted text-xs">
              No reputation badges yet.
            </span>
          ) : (
            reputationBadges.map((badge) => (
              <span key={badge} className="badge">
                {badge}
              </span>
            ))
          )}
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Smart Notifications</h2>
        {smartNotifications.length === 0 ? (
          <p className="text-lh-muted text-sm">No smart reminders right now.</p>
        ) : (
          <div className="space-y-2">
            {smartNotifications.map((item, index) => (
              <article
                key={`${item.type}-${index}`}
                className="border-lh-border rounded border p-2"
              >
                <p className="text-sm">{item.message}</p>
                <div className="mt-1">
                  <Link
                    href={`/ai?prompt=${encodeURIComponent(item.message)}`}
                    className="text-lh-accent text-xs hover:underline"
                  >
                    Ask AI Concierge to help
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {loading && (
        <p className="card text-lh-muted text-sm">Loading dashboard...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Saved vendors</h2>
        {savedVendors.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No saved vendors yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {savedVendors.map((vendor) => (
              <article key={vendor.id} className="card space-y-1">
                <p className="font-medium">{vendor.business_name}</p>
                <Link
                  href={`/vendors/${vendor.id}`}
                  className="text-lh-accent text-sm hover:underline"
                >
                  View profile
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Saved listings</h2>
        {savedListings.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No saved listings yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {savedListings.map((listing) => (
              <article key={listing.id} className="card space-y-1">
                <p className="font-medium">{listing.title}</p>
                <p className="text-lh-muted text-sm">{listing.description}</p>
                <Link
                  href={`/listings/${listing.id}`}
                  className="text-lh-accent text-sm hover:underline"
                >
                  View listing
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Active bookings</h2>
        {activeBookings.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No active bookings.</p>
          </div>
        ) : (
          activeBookings.map((booking) => (
            <article key={booking.id} className="card">
              <p className="text-lh-muted text-sm">Booking {booking.id}</p>
              <p className="text-lh-muted text-sm">
                Vendor: {booking.vendor_id}
              </p>
              <p className="text-lh-muted text-sm">
                Date: {new Date(booking.preferred_date).toLocaleDateString()}
              </p>
              <p className="text-lh-muted text-sm">Status: {booking.status}</p>
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Past bookings</h2>
        {pastBookings.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No past bookings.</p>
          </div>
        ) : (
          pastBookings.map((booking) => (
            <article key={booking.id} className="card">
              <p className="text-lh-muted text-sm">Booking {booking.id}</p>
              <p className="text-lh-muted text-sm">
                Vendor: {booking.vendor_id}
              </p>
              <p className="text-lh-muted text-sm">
                Date: {new Date(booking.preferred_date).toLocaleDateString()}
              </p>
              <p className="text-lh-muted text-sm">Status: {booking.status}</p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
