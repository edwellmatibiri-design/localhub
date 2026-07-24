"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/db";

type BookingRow = {
  id: string;
  vendor_id: string;
  user_id: string;
  quote_id: string | null;
  preferred_date: string;
  status: "new" | "paid" | "confirmed" | "completed" | "cancelled" | "refunded";
};

type VendorRow = {
  id: string;
  business_name: string;
};

export default function AccountBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [vendorsById, setVendorsById] = useState<Record<string, VendorRow>>({});
  const [trustBadges, setTrustBadges] = useState<string[]>([]);
  const [reputationScore, setReputationScore] = useState(50);
  const [reputationBadges, setReputationBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const userId = String(auth?.user?.id ?? "");

        if (!userId) {
          setBookings([]);
          setLoading(false);
          return;
        }

        const { data: trust } = await supabase
          .from("user_trust_profile")
          .select("trust_score, phone_verified, email_verified")
          .eq("user_id", userId)
          .maybeSingle();

        const badges: string[] = [];
        if (Boolean(trust?.phone_verified)) badges.push("Phone Verified");
        if (Boolean(trust?.email_verified)) badges.push("Email Verified");
        if (Number(trust?.trust_score ?? 50) >= 70) badges.push("Trusted User");
        if (Number(trust?.trust_score ?? 50) >= 90) badges.push("Premium User");
        setTrustBadges(badges);

        const { data: reputation } = await supabase
          .from("user_reputation")
          .select(
            "reputation_score, completed_bookings, cancelled_bookings, on_time_payments, late_payments",
          )
          .eq("user_id", userId)
          .maybeSingle();

        const repScore = Number(reputation?.reputation_score ?? 50);
        setReputationScore(repScore);
        const repBadges: string[] = [];
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

        const { data: bookingRows, error: bookingsError } = await supabase
          .from("bookings")
          .select("id, vendor_id, user_id, quote_id, preferred_date, status")
          .eq("user_id", userId)
          .order("preferred_date", { ascending: false });

        if (bookingsError) {
          throw bookingsError;
        }

        const normalized = (bookingRows ?? []) as BookingRow[];
        setBookings(normalized);

        const vendorIds = Array.from(
          new Set(normalized.map((row) => row.vendor_id)),
        ).filter(Boolean);
        if (!vendorIds.length) {
          setVendorsById({});
          return;
        }

        const { data: vendorRows, error: vendorsError } = await supabase
          .from("seller_profiles")
          .select("id, business_name")
          .in("id", vendorIds);

        if (vendorsError) {
          throw vendorsError;
        }

        const map: Record<string, VendorRow> = {};
        (vendorRows ?? []).forEach((vendor) => {
          map[String(vendor.id)] = {
            id: String(vendor.id),
            business_name: String(vendor.business_name ?? "Vendor"),
          };
        });
        setVendorsById(map);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load bookings",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (row) => row.status !== "completed" && row.status !== "cancelled",
      ),
    [bookings],
  );
  const pastBookings = useMemo(
    () =>
      bookings.filter(
        (row) => row.status === "completed" || row.status === "cancelled",
      ),
    [bookings],
  );

  async function cancelBooking(bookingId: string) {
    try {
      const response = await fetch("/api/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, newStatus: "cancelled" }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to cancel booking"));
      }

      setBookings((current) =>
        current.map((row) =>
          row.id === bookingId ? { ...row, status: "cancelled" } : row,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">My Bookings</h1>
      <section className="card space-y-2">
        <h2 className="text-sm font-semibold">AI Booking Assistant</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ai?prompt=Help me understand pricing"
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Explain pricing
          </Link>
          <Link
            href="/ai?prompt=Help me understand the booking process"
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Explain process
          </Link>
          <Link
            href="/ai?prompt=Help me compare vendors for my booking"
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Compare vendors
          </Link>
          <Link
            href="/ai?prompt=Help me with cancellation rules"
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Cancellation rules
          </Link>
          <Link
            href="/ai?prompt=Help me choose date and time"
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Choose date/time
          </Link>
          <Link
            href="/ai?prompt=Help me choose service options"
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Choose service options
          </Link>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
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
      <div className="flex flex-wrap gap-2">
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
      {reputationScore <= 40 && (
        <p className="card text-lh-on-accent text-sm">Low Reputation User</p>
      )}
      {loading && (
        <p className="card text-lh-muted text-sm">Loading bookings...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active bookings</h2>
        {activeBookings.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No active bookings.</p>
          </div>
        ) : (
          activeBookings.map((booking) => (
            <article key={booking.id} className="card space-y-2">
              <p className="text-sm font-medium">
                Vendor:{" "}
                {vendorsById[booking.vendor_id]?.business_name ?? "Vendor"}
              </p>
              <p className="text-lh-muted text-sm">
                Preferred date:{" "}
                {new Date(booking.preferred_date).toLocaleDateString()}
              </p>
              <p className="text-lh-muted text-sm">
                Status: <span className="capitalize">{booking.status}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cancelBooking(booking.id)}
                  className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                >
                  Cancel
                </button>
                <Link
                  href={`/vendors/${booking.vendor_id}`}
                  className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-1 text-sm"
                >
                  View vendor
                </Link>
                <Link
                  href={`/account/bookings/${booking.id}/dispute`}
                  className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                >
                  Open dispute
                </Link>
                {booking.status === "completed" && (
                  <Link
                    href={`/account/bookings/${booking.id}/confirm`}
                    className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                  >
                    Confirm completion
                  </Link>
                )}
                {(booking.status === "new" ||
                  booking.status === "confirmed") && (
                  <Link
                    href={`/bookings/${booking.id}/pay`}
                    className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                  >
                    Pay now
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Past bookings</h2>
        {pastBookings.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No past bookings.</p>
          </div>
        ) : (
          pastBookings.map((booking) => (
            <article key={booking.id} className="card space-y-1">
              <p className="text-sm font-medium">
                Vendor:{" "}
                {vendorsById[booking.vendor_id]?.business_name ?? "Vendor"}
              </p>
              <p className="text-lh-muted text-sm">
                Preferred date:{" "}
                {new Date(booking.preferred_date).toLocaleDateString()}
              </p>
              <p className="text-lh-muted text-sm">
                Status: <span className="capitalize">{booking.status}</span>
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
