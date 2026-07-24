"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type BookingRow = {
  id: string;
  vendor_id: string;
  user_id: string;
  preferred_date: string;
  status: "new" | "confirmed" | "completed" | "cancelled";
};

type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
};

type UserTrustRow = {
  user_id: string;
  trust_score: number;
  phone_verified: boolean;
  email_verified: boolean;
};

type UserReputationRow = {
  user_id: string;
  reputation_score: number;
  completed_bookings: number;
  cancelled_bookings: number;
  on_time_payments: number;
  late_payments: number;
};

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserRow>>({});
  const [trustByUserId, setTrustByUserId] = useState<
    Record<string, UserTrustRow>
  >({});
  const [reputationByUserId, setReputationByUserId] = useState<
    Record<string, UserReputationRow>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instantQuoteByBooking, setInstantQuoteByBooking] = useState<
    Record<string, { minPrice: number; maxPrice: number; confidence: number }>
  >({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const vendorFromQuery =
          new URLSearchParams(window.location.search).get("vendorId") ?? "";

        let vendorId = vendorFromQuery;
        if (!vendorId) {
          const { data: profile } = await supabase
            .from("seller_profiles")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          vendorId = String(profile?.id ?? "");
        }

        if (!vendorId) {
          setBookings([]);
          return;
        }

        const { data: bookingRows, error: bookingsError } = await supabase
          .from("bookings")
          .select("id, vendor_id, user_id, preferred_date, status")
          .eq("vendor_id", vendorId)
          .order("preferred_date", { ascending: true });

        if (bookingsError) {
          throw bookingsError;
        }

        const normalized = (bookingRows ?? []) as BookingRow[];
        setBookings(normalized);

        const userIds = Array.from(
          new Set(normalized.map((row) => row.user_id)),
        ).filter(Boolean);
        if (!userIds.length) {
          setUsersById({});
          setTrustByUserId({});
          return;
        }

        const { data: userRows, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds);

        if (usersError) {
          throw usersError;
        }

        const userMap: Record<string, UserRow> = {};
        (userRows ?? []).forEach((user) => {
          userMap[String(user.id)] = {
            id: String(user.id),
            full_name: String(user.full_name ?? "User"),
            email: user.email ? String(user.email) : null,
          };
        });

        setUsersById(userMap);

        const { data: trustRows } = await supabase
          .from("user_trust_profile")
          .select("user_id, trust_score, phone_verified, email_verified")
          .in("user_id", userIds);

        const { data: reputationRows } = await supabase
          .from("user_reputation")
          .select(
            "user_id, reputation_score, completed_bookings, cancelled_bookings, on_time_payments, late_payments",
          )
          .in("user_id", userIds);

        const trustMap: Record<string, UserTrustRow> = {};
        (trustRows ?? []).forEach((row) => {
          trustMap[String(row.user_id)] = {
            user_id: String(row.user_id),
            trust_score: Number(row.trust_score ?? 50),
            phone_verified: Boolean(row.phone_verified),
            email_verified: Boolean(row.email_verified),
          };
        });
        setTrustByUserId(trustMap);

        const reputationMap: Record<string, UserReputationRow> = {};
        (reputationRows ?? []).forEach((row) => {
          reputationMap[String(row.user_id)] = {
            user_id: String(row.user_id),
            reputation_score: Number(row.reputation_score ?? 50),
            completed_bookings: Number(row.completed_bookings ?? 0),
            cancelled_bookings: Number(row.cancelled_bookings ?? 0),
            on_time_payments: Number(row.on_time_payments ?? 0),
            late_payments: Number(row.late_payments ?? 0),
          };
        });
        setReputationByUserId(reputationMap);
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

  async function setStatus(
    bookingId: string,
    newStatus: "confirmed" | "completed",
  ) {
    try {
      const response = await fetch("/api/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, newStatus }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to update booking"));
      }

      setBookings((current) =>
        current.map((row) =>
          row.id === bookingId ? { ...row, status: newStatus } : row,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
    }
  }

  async function generateInstantQuote(bookingId: string) {
    setError(null);
    try {
      const response = await fetch("/api/vendor/instant-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: Number(bookingId) }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to generate instant quote"),
        );
      }

      setInstantQuoteByBooking((current) => ({
        ...current,
        [bookingId]: {
          minPrice: Number(payload.quote?.minPrice ?? 0),
          maxPrice: Number(payload.quote?.maxPrice ?? 0),
          confidence: Number(payload.quote?.confidence ?? 0),
        },
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate instant quote",
      );
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Bookings</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading bookings...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && bookings.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const user = usersById[booking.user_id];
            const trust = trustByUserId[booking.user_id];
            const reputation = reputationByUserId[booking.user_id];
            const badges = [
              trust?.phone_verified ? "Phone Verified" : null,
              trust?.email_verified ? "Email Verified" : null,
              Number(trust?.trust_score ?? 50) >= 70 ? "Trusted User" : null,
              Number(trust?.trust_score ?? 50) >= 90 ? "Premium User" : null,
              Number(reputation?.reputation_score ?? 50) >= 61
                ? "Trusted User"
                : null,
              Number(reputation?.reputation_score ?? 50) >= 81
                ? "Premium User"
                : null,
              Number(reputation?.completed_bookings ?? 0) >= 5 &&
              Number(reputation?.cancelled_bookings ?? 0) === 0
                ? "Reliable Booker"
                : null,
              Number(reputation?.on_time_payments ?? 0) > 0 &&
              Number(reputation?.late_payments ?? 0) === 0
                ? "Perfect Payment Record"
                : null,
            ].filter(Boolean) as string[];
            return (
              <article key={booking.id} className="card space-y-2">
                <p className="text-sm font-medium">
                  User: {user?.full_name ?? "Unknown user"}
                </p>
                <p className="text-lh-muted text-sm">
                  Email: {user?.email ?? "No email"}
                </p>
                <p className="text-lh-muted text-sm">
                  Trust score: {Number(trust?.trust_score ?? 50)}
                </p>
                <p className="text-lh-muted text-sm">
                  Reputation score: {Number(reputation?.reputation_score ?? 50)}
                </p>
                {Number(trust?.trust_score ?? 50) < 20 && (
                  <p className="text-lh-on-accent text-sm">Low Trust User</p>
                )}
                {Number(reputation?.reputation_score ?? 50) <= 20 && (
                  <p className="text-lh-on-accent text-sm">High Risk User</p>
                )}
                {Number(reputation?.reputation_score ?? 50) > 20 &&
                  Number(reputation?.reputation_score ?? 50) <= 40 && (
                    <p className="text-lh-on-accent text-sm">
                      Low Reputation User
                    </p>
                  )}
                <div className="flex flex-wrap gap-2">
                  {badges.length === 0 ? (
                    <span className="text-lh-muted text-xs">
                      No trust badges
                    </span>
                  ) : (
                    badges.map((badge) => (
                      <span key={`${booking.id}-${badge}`} className="badge">
                        {badge}
                      </span>
                    ))
                  )}
                </div>
                <p className="text-lh-muted text-sm">
                  Preferred date:{" "}
                  {new Date(booking.preferred_date).toLocaleDateString()}
                </p>
                <p className="text-lh-muted text-sm">
                  Status: <span className="capitalize">{booking.status}</span>
                </p>
                {instantQuoteByBooking[booking.id] && (
                  <p className="text-lh-emerald text-sm">
                    Instant quote: R{" "}
                    {instantQuoteByBooking[booking.id].minPrice} - R{" "}
                    {instantQuoteByBooking[booking.id].maxPrice} (confidence{" "}
                    {Math.round(
                      instantQuoteByBooking[booking.id].confidence * 100,
                    )}
                    %)
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus(booking.id, "confirmed")}
                    className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => void generateInstantQuote(booking.id)}
                    className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                  >
                    Generate instant quote
                  </button>
                  <Link
                    href={`/vendors/dashboard/bookings/${booking.id}/complete`}
                    className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-1 text-sm"
                  >
                    Mark completed
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
