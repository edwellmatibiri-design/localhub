"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { createClient } from "@/lib/db";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

type BookingRow = {
  id: number;
  vendor_id: string;
  user_id: string;
  status: string;
  payment_intent_id: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
};

function CheckoutForm({
  bookingId,
  paymentIntentId,
  onConfirmed,
  onError,
}: {
  bookingId: number;
  paymentIntentId: string;
  onConfirmed: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    onError("");

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment confirmation failed");
      }

      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paymentIntentId }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to finalize payment"));
      }

      onConfirmed();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <PaymentElement />
      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {submitting ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

type Props = {
  params: Promise<{ bookingId: string }>;
};

export default function BookingPayPage({ params }: Props) {
  const [bookingId, setBookingId] = useState(0);
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void params.then((resolved) => {
      setBookingId(Number(resolved.bookingId));
    });
  }, [params]);

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    async function loadBooking() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();
        const { data, error: bookingError } = await supabase
          .from("bookings")
          .select(
            "id, vendor_id, user_id, status, payment_intent_id, payment_amount, payment_currency",
          )
          .eq("id", bookingId)
          .maybeSingle();

        if (bookingError) {
          throw bookingError;
        }

        if (!data) {
          throw new Error("Booking not found");
        }

        const bookingRow = data as BookingRow;
        setBooking(bookingRow);

        const amount = Number(bookingRow.payment_amount ?? 0) || 10000;
        const currency = String(
          bookingRow.payment_currency ?? "zar",
        ).toLowerCase();

        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: bookingRow.id, amount, currency }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(
            String(payload?.error ?? "Failed to create payment intent"),
          );
        }

        setClientSecret(String(payload.clientSecret ?? ""));
        setPaymentIntentId(String(payload.paymentIntentId ?? ""));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payment");
      } finally {
        setLoading(false);
      }
    }

    void loadBooking();
  }, [bookingId]);

  const stripeOptions = useMemo(
    () => (clientSecret ? { clientSecret } : undefined),
    [clientSecret],
  );

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Pay Booking</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Preparing payment...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}
      {success && (
        <p className="card text-lh-emerald text-sm">
          Payment successful. Booking is now paid.
        </p>
      )}

      {!loading &&
        booking &&
        clientSecret &&
        paymentIntentId &&
        stripeOptions && (
          <div className="card space-y-3">
            <p className="text-lh-muted text-sm">Booking ID: {booking.id}</p>
            <p className="text-lh-muted text-sm">
              Current status: {booking.status}
            </p>
            <Elements stripe={stripePromise} options={stripeOptions}>
              <CheckoutForm
                bookingId={booking.id}
                paymentIntentId={paymentIntentId}
                onConfirmed={() => setSuccess(true)}
                onError={(message) => setError(message)}
              />
            </Elements>
          </div>
        )}
    </section>
  );
}
