"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateVendorListingPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [images, setImages] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorId = String(params.get("vendorId") ?? "").trim();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/listings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: vendorId,
          title,
          description,
          priceRange,
          images: images
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to create listing"));
      }

      router.push(`/vendors/dashboard?vendorId=${vendorId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Create Listing</h1>
        <form className="card space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="border-lh-border rounded-lg border px-3 py-2"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="border-lh-border rounded-lg border px-3 py-2"
              rows={4}
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Price Range</label>
            <input
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
              className="border-lh-border rounded-lg border px-3 py-2"
              placeholder="e.g. 500-1500"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Images (mock upload URLs, comma-separated)
            </label>
            <input
              value={images}
              onChange={(event) => setImages(event.target.value)}
              className="border-lh-border rounded-lg border px-3 py-2"
              placeholder="https://image-1.jpg, https://image-2.jpg"
            />
          </div>

          {error && <p className="text-lh-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
        </form>
      </div>
    </section>
  );
}
