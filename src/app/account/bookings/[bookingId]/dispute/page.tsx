"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type BookingRow = {
  id: number;
  user_id: string;
  vendor_id: string;
  preferred_date: string;
  status: string;
};

type Props = {
  params: Promise<{ bookingId: string }>;
};

export default function BookingDisputePage({ params }: Props) {
  const [bookingId, setBookingId] = useState(0);
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
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
          .select("id, user_id, vendor_id, preferred_date, status")
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
    if (!booking || !reason.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/disputes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          userId: booking.user_id,
          vendorId: booking.vendor_id,
          reason: reason.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to create dispute"));
      }

      setSuccess(`Dispute ${payload.disputeId} submitted successfully.`);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit dispute");
    } finally {
      setSubmitting(false);
    }
  }

  async function draftWithAi() {
    if (!booking) return;
    setDrafting(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Help me write a dispute summary for booking ${booking.id}. Status: ${booking.status}. Current notes: ${reason || "none"}`,
          role: "user",
          userId: booking.user_id,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to draft dispute summary"),
        );
      }

      setReason(String(payload.reply ?? ""));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to draft dispute summary",
      );
    } finally {
      setDrafting(false);
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Raise a Dispute</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading booking...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}
      {success && <p className="card text-lh-emerald text-sm">{success}</p>}

      {booking && (
        <div className="card space-y-3">
          <p className="text-lh-muted text-sm">Booking #{booking.id}</p>
          <p className="text-lh-muted text-sm">Vendor: {booking.vendor_id}</p>
          <p className="text-lh-muted text-sm">
            Date: {new Date(booking.preferred_date).toLocaleDateString()}
          </p>
          <p className="text-lh-muted text-sm">Status: {booking.status}</p>

          <form onSubmit={submit} className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void draftWithAi()}
                disabled={drafting}
                className="border-lh-border rounded-lg border px-3 py-1 text-sm disabled:opacity-60"
              >
                {drafting ? "Drafting..." : "Help me write dispute summary"}
              </button>
            </div>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="border-lh-border min-h-24 w-full rounded-lg border px-3 py-2"
              placeholder="Describe the issue"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Dispute"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
