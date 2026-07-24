"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  params: Promise<{ vendorId: string }>;
};

export default function VendorQuotePage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vendorId, setVendorId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  void params.then((resolved) => {
    if (!vendorId) {
      setVendorId(resolved.vendorId);
    }
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const userId = String(searchParams.get("userId") ?? "").trim();
    const message = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Service: ${serviceDescription}`,
    ].join("\n");

    try {
      const response = await fetch("/api/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          userId,
          message,
          preferredDate,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to create quote"));
      }

      router.push(
        `/vendors/${vendorId}/quote/confirmation?quoteId=${payload.quoteId}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit quote request",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell p-6">
      <form onSubmit={onSubmit} className="card mx-auto max-w-xl space-y-3">
        <h1 className="text-2xl font-semibold">Request Quote</h1>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="border-lh-border w-full rounded-lg border px-3 py-2"
          placeholder="Name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border-lh-border w-full rounded-lg border px-3 py-2"
          placeholder="Email"
          required
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="border-lh-border w-full rounded-lg border px-3 py-2"
          placeholder="Phone"
          required
        />
        <textarea
          value={serviceDescription}
          onChange={(event) => setServiceDescription(event.target.value)}
          className="border-lh-border min-h-24 w-full rounded-lg border px-3 py-2"
          placeholder="Service description"
          required
        />
        <input
          type="date"
          value={preferredDate}
          onChange={(event) => setPreferredDate(event.target.value)}
          className="border-lh-border w-full rounded-lg border px-3 py-2"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit quote request"}
        </button>

        {error && <p className="text-lh-danger text-sm">{error}</p>}
      </form>
    </section>
  );
}
