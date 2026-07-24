import Link from "next/link";

type ListingCardProps = {
  listingId: string;
  title: string;
  vendorId: string;
  vendorName: string;
  trustBadge: "gold" | "silver" | "bronze" | "none";
  priceRange: string;
  earnPoints?: number;
};

const badgeClassByType: Record<ListingCardProps["trustBadge"], string> = {
  gold: "bg-lh-warning/20 text-lh-warning",
  silver: "bg-lh-surface-soft text-lh-text-secondary",
  bronze: "bg-lh-warning/20 text-lh-warning",
  none: "bg-lh-surface-soft text-lh-text-secondary",
};

export default function ListingCard({
  listingId,
  title,
  vendorId,
  vendorName,
  trustBadge,
  priceRange,
  earnPoints = 50,
}: ListingCardProps) {
  return (
    <article className="card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <span className={`badge capitalize ${badgeClassByType[trustBadge]}`}>
          {trustBadge}
        </span>
      </div>
      <p className="text-lh-muted text-sm">Price: {priceRange}</p>
      <p className="text-lh-emerald text-sm">
        Earn {earnPoints} points with this booking
      </p>
      <p className="text-lh-muted text-sm">
        By{" "}
        <Link
          href={`/vendors/${vendorId}`}
          className="text-lh-accent font-medium hover:underline"
        >
          {vendorName}
        </Link>
      </p>
      <Link
        href={`/listings/${listingId}`}
        className="text-lh-accent inline-block text-sm font-medium hover:underline"
      >
        View listing
      </Link>
    </article>
  );
}
