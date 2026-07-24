"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { updateListing } from "@/app/actions/updateListing";
import { toast } from "react-hot-toast";
import type { Listing } from "@/types";

type EditListingFormProps = {
  listing: Pick<Listing, "id" | "title" | "price" | "description">;
};

export function EditListingForm({ listing }: EditListingFormProps) {
  const [title, setTitle] = useState(listing.title);
  const [price, setPrice] = useState(String(listing.price));
  const [description, setDescription] = useState(listing.description);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateListing({
        id: listing.id,
        title,
        price: Number(price),
        description,
      });

      if (result.success) {
        toast.success("Listing updated");
      } else {
        toast.error(result.message || "Failed to update listing");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Listing title</label>
        <input
          className="border-lh-border w-full rounded border px-3 py-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Price</label>
        <input
          type="number"
          className="border-lh-border w-full rounded border px-3 py-2"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="border-lh-border w-full rounded border px-3 py-2"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-lh-bg text-lh-on-accent rounded px-4 py-2 disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
