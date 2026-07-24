import type { Listing } from "@/types";

export default function CardListing({ listing }: { listing: Listing }) {
  return (
    <article className="card">
      <p className="badge bg-lh-accent/10 text-lh-accent">Listing</p>
      <h3 className="mt-3 text-lg font-semibold">{listing.title}</h3>
      <p className="text-lh-muted mt-2 text-sm">{listing.description}</p>
      <p className="text-lh-emerald mt-3 text-sm font-semibold">
        R {listing.price.toLocaleString("en-ZA")}
      </p>
    </article>
  );
}
