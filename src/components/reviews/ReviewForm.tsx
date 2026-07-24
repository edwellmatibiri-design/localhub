"use client";

import { FormEvent, useState } from "react";

type Props = {
  sellerId: string;
  listingId: string;
};

export default function ReviewForm({ sellerId, listingId }: Props) {
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Submitting...");

    const form = new FormData(event.currentTarget);
    const rating = Number(form.get("rating") ?? 5);
    const comment = String(form.get("comment") ?? "");

    const response = await fetch("/api/reviews/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
      },
      body: JSON.stringify({
        seller_id: sellerId,
        listing_id: listingId,
        rating,
        comment,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setMessage(payload?.error ?? "Could not submit review.");
      return;
    }

    setMessage("Review submitted.");
    event.currentTarget.reset();
  }

  return (
    <form className="card space-y-3" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold">Leave a Review</h3>
      <div className="grid gap-3 md:grid-cols-[140px_1fr]">
        <select
          name="rating"
          className="border-lh-border rounded-lg border px-3 py-2"
          defaultValue="5"
        >
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Okay</option>
          <option value="2">2 - Poor</option>
          <option value="1">1 - Bad</option>
        </select>
        <input
          name="comment"
          className="border-lh-border rounded-lg border px-3 py-2"
          placeholder="Share your experience"
          required
        />
      </div>
      <button
        className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
        type="submit"
      >
        Submit Review
      </button>
      {message && <p className="text-lh-muted text-sm">{message}</p>}
    </form>
  );
}
