"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateDeviceHashFromBrowser } from "@/lib/identity/deviceFingerprint";

type Props = {
  params: Promise<{ bookingId: string }>;
};

export default function UserConfirmBookingPage({ params }: Props) {
  const router = useRouter();
  const [bookingId, setBookingId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  void params.then((resolved) => {
    if (!bookingId) setBookingId(Number(resolved.bookingId));
  });

  async function confirmCompleted() {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          deviceHash: generateDeviceHashFromBrowser(),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to confirm completion"),
        );
      }

      setSuccess(
        "Job confirmed. Vendor has been notified and payout was triggered.",
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm completion",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Confirm Job Completed</h1>
      <div className="card space-y-3">
        <p className="text-lh-muted text-sm">Booking #{bookingId || "-"}</p>
        <button
          type="button"
          onClick={confirmCompleted}
          disabled={loading || !bookingId}
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Confirming..." : "Confirm Job Completed"}
        </button>
        {error && <p className="text-lh-danger text-sm">{error}</p>}
        {success && <p className="text-lh-emerald text-sm">{success}</p>}
      </div>
    </section>
  );
}
