import Link from "next/link";

type VendorTag = "verified" | "popular" | "fast-response";

export type VendorCardProps = {
  name: string;
  category: string;
  rating: number;
  reviewCount?: number;
  location: string;
  profileImageUrl: string;
  profileImageAlt?: string;
  href: string;
  tags?: VendorTag[];
  className?: string;
};

const tagStyles: Record<VendorTag, string> = {
  verified: "border-lh-success/35 bg-lh-success/15 text-lh-success",
  popular: "border-lh-warning/35 bg-lh-warning/15 text-lh-warning",
  "fast-response": "border-lh-accent/35 bg-lh-accent/15 text-lh-accent",
};

const tagLabel: Record<VendorTag, string> = {
  verified: "Verified",
  popular: "Popular",
  "fast-response": "Fast response",
};

function formatRating(rating: number): string {
  return Math.max(0, Math.min(5, rating)).toFixed(1);
}

export default function VendorCard({
  name,
  category,
  rating,
  reviewCount,
  location,
  profileImageUrl,
  profileImageAlt,
  href,
  tags = ["verified", "popular", "fast-response"],
  className,
}: VendorCardProps) {
  return (
    <article
      className={`border-lh-border bg-lh-surface relative flex h-full flex-col gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lh-soft ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <img
          src={profileImageUrl}
          alt={profileImageAlt ?? `${name} profile image`}
          className="border-lh-border h-14 w-14 shrink-0 rounded-full border object-cover"
          loading="lazy"
        />

        <div className="min-w-0 flex-1">
          <h3 className="text-lh-text-primary truncate text-base font-semibold">
            {name}
          </h3>
          <p className="text-lh-muted mt-0.5 truncate text-sm">{category}</p>
          <p className="text-lh-text-secondary mt-1 text-sm">
            <span className="text-lh-warning">★</span> {formatRating(rating)}
            {typeof reviewCount === "number" ? ` (${reviewCount})` : ""}
          </p>
        </div>
      </div>

      <p className="text-lh-text-secondary text-sm">{location}</p>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${tagStyles[tag]}`}
          >
            {tagLabel[tag]}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-1">
        <Link
          href={href}
          className="bg-lh-accent text-lh-on-accent hover:bg-lh-accent-soft inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
        >
          View Vendor
        </Link>
      </div>
    </article>
  );
}

export function VendorCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      aria-hidden="true"
      className={`border-lh-border bg-lh-surface relative flex h-full flex-col gap-4 rounded-2xl border p-4 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="bg-lh-surface-soft h-14 w-14 animate-pulse rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="bg-lh-surface-soft h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-lh-surface-soft h-3 w-1/2 animate-pulse rounded" />
          <div className="bg-lh-surface-soft h-3 w-1/3 animate-pulse rounded" />
        </div>
      </div>

      <div className="bg-lh-surface-soft h-3 w-3/4 animate-pulse rounded" />

      <div className="flex gap-2">
        <div className="bg-lh-surface-soft h-6 w-20 animate-pulse rounded-full" />
        <div className="bg-lh-surface-soft h-6 w-20 animate-pulse rounded-full" />
        <div className="bg-lh-surface-soft h-6 w-24 animate-pulse rounded-full" />
      </div>

      <div className="bg-lh-surface-soft mt-auto h-9 w-full animate-pulse rounded-xl" />
    </article>
  );
}
