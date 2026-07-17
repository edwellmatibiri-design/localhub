import type { Listing } from "@/types";

export default function CardListing({ listing }: { listing: Listing }) {
  return (
    <article className="card">
      <p className="badge bg-lh-electric-blue/10 text-lh-electric-blue">Listing</p>
      <h3 className="mt-3 text-lg font-semibold">{listing.title}</h3>
      <p className="mt-2 text-sm text-lh-muted">{listing.description}</p>
      <p className="mt-3 text-sm font-semibold text-lh-emerald">R {listing.price.toLocaleString("en-ZA")}</p>
    </article>
  );
}
