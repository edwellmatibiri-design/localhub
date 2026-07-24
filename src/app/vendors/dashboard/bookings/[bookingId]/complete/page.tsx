"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  params: Promise<{ bookingId: string }>;
};

export default function VendorCompleteBookingPage({ params }: Props) {
  const router = useRouter();
  const [bookingId, setBookingId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  void params.then((resolved) => {
    if (!bookingId) setBookingId(Number(resolved.bookingId));
  });

  async function markCompleted() {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/bookings/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to mark booking completed"),
        );
      }

      setSuccess("Job marked completed. User has been notified.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark booking completed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Mark Job Completed</h1>
      <div className="card space-y-3">
        <p className="text-lh-muted text-sm">Booking #{bookingId || "-"}</p>
        <button
          type="button"
          onClick={markCompleted}
          disabled={loading || !bookingId}
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Updating..." : "Mark Job Completed"}
        </button>
        {error && <p className="text-lh-danger text-sm">{error}</p>}
        {success && <p className="text-lh-emerald text-sm">{success}</p>}
      </div>
    </section>
  );
}
