"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type BookingRow = {
  id: number;
  vendor_id: string;
  user_id: string;
  preferred_date: string;
  status: string;
};

type Props = {
  params: Promise<{ bookingId: string }>;
};

export default function BookingReviewPage({ params }: Props) {
  const [bookingId, setBookingId] = useState(0);
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void params.then((resolved) => setBookingId(Number(resolved.bookingId)));
  }, [params]);

  useEffect(() => {
    if (!bookingId) return;

    async function loadBooking() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: bookingError } = await supabase
          .from("bookings")
          .select("id, vendor_id, user_id, preferred_date, status")
          .eq("id", bookingId)
          .maybeSingle();

        if (bookingError) throw bookingError;
        setBooking((data ?? null) as BookingRow | null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking");
      } finally {
        setLoading(false);
      }
    }

    void loadBooking();
  }, [bookingId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!booking || !review.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: booking.vendor_id,
          userId: booking.user_id,
          bookingId: booking.id,
          rating,
          review: review.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to submit review"));
      }

      setSuccess(`Review ${payload.reviewId} submitted.`);
      setReview("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Leave a Review</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading booking...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}
      {success && <p className="card text-lh-emerald text-sm">{success}</p>}

      {booking && (
        <div className="card space-y-3">
          <p className="text-lh-muted text-sm">Booking #{booking.id}</p>
          <p className="text-lh-muted text-sm">Vendor: {booking.vendor_id}</p>
          <p className="text-lh-muted text-sm">Status: {booking.status}</p>

          <form onSubmit={submit} className="space-y-2">
            <label className="block text-sm">
              Rating
              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="border-lh-border mt-1 w-full rounded-lg border px-3 py-2"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Review
              <textarea
                value={review}
                onChange={(event) => setReview(event.target.value)}
                className="border-lh-border mt-1 min-h-28 w-full rounded-lg border px-3 py-2"
                placeholder="Share your experience"
                required
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
